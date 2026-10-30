import mongoose from "mongoose";
import { Activity, Team, User, Workout } from "../models/index.js";

type ServiceError = Error & { status: number };

function serviceError(message: string, status = 400): ServiceError {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireId(value: unknown, field: string): string {
  if (typeof value !== "string" || !mongoose.Types.ObjectId.isValid(value)) {
    throw serviceError(`${field} must be a valid ID`);
  }
  return value;
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw serviceError("Activity details are required");
  const userId = requireId(input.userId, "userId");
  const teamId = requireId(input.teamId, "teamId");
  if (typeof input.type !== "string" || !input.type.trim())
    throw serviceError("Activity type is required");
  if (
    typeof input.minutes !== "number" ||
    !Number.isInteger(input.minutes) ||
    input.minutes < 1
  ) {
    throw serviceError("Minutes must be a positive whole number");
  }

  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);
  if (!user || !team) throw serviceError("User or team was not found", 404);
  if (user.team && user.team.toString() !== team._id.toString()) {
    throw serviceError("Activity team must match the user team");
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: input.type.trim().toLowerCase(),
    minutes: input.minutes,
    points: input.minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw serviceError("Team details are required");
  if (typeof input.name !== "string" || !input.name.trim())
    throw serviceError("Team name is required");
  if (typeof input.mascot !== "string" || !input.mascot.trim())
    throw serviceError("Team mascot is required");

  const rawMembers = input.members ?? [];
  if (!Array.isArray(rawMembers))
    throw serviceError("Team members must be an array");
  const memberIds = [
    ...new Set(rawMembers.map((member) => requireId(member, "member"))),
  ];
  const users = memberIds.length
    ? await User.find({ _id: { $in: memberIds } })
    : [];
  if (users.length !== memberIds.length)
    throw serviceError("One or more team members were not found", 404);

  const team = await Team.create({
    name: input.name.trim(),
    mascot: input.mascot.trim(),
    members: memberIds,
  });
  for (const user of users) {
    if (user.team && user.team.toString() !== team._id.toString()) {
      await Team.updateOne(
        { _id: user.team },
        { $pull: { members: user._id } },
      );
    }
  }
  if (users.length)
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $set: { team: team._id } },
    );
  return team;
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: "$team", totalPoints: { $sum: "$points" } } },
    ]),
  ]);
  const pointsByTeam = new Map(
    totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]),
  );
  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort(
      (left, right) =>
        right.totalPoints - left.totalPoints ||
        left.teamName.localeCompare(right.teamName),
    )
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({
    email: userEmail.trim().toLowerCase(),
  }).lean();
  if (!user) throw serviceError("User was not found", 404);

  const recentActivity = await Activity.findOne({ user: user._id })
    .sort({ occurredAt: -1 })
    .lean();
  const activityFocus: Record<string, string> = {
    run: "endurance",
    cycle: "endurance",
    walk: "mobility",
    strength: "strength",
    yoga: "mobility",
  };
  const focus =
    user.fitnessGoal ||
    (recentActivity ? activityFocus[recentActivity.type] : undefined);
  if (!focus) return [];

  const workouts = await Workout.find({ focus }).sort({ minutes: 1 }).lean();
  const reason = user.fitnessGoal
    ? `Matches your ${focus} fitness goal.`
    : `Based on your recent ${recentActivity?.type} activity.`;
  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
