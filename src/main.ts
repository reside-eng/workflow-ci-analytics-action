import * as core from '@actions/core';
import { context } from '@actions/github';
import { BigQuery } from '@google-cloud/bigquery';
import { Inputs } from './inputs';

async function sendToBigQuery({
  createdAt,
  startedAt,
  completedAt,
  matrixName,
  matrixValue,
  result,
  draft,
  jobLink,
  repository,
  workflow,
  job,
  actor,
  runId,
  runNumber,
  sha,
  eventName,
}: {
  createdAt: string;
  startedAt: string;
  completedAt: string;
  matrixName: string;
  matrixValue: string;
  result: string;
  draft: string;
  jobLink: string;
  repository: string;
  workflow: string;
  job: string;
  actor: string;
  runId: number;
  runNumber: number;
  sha: string;
  eventName: string;
}): Promise<void> {
  const client = new BigQuery();

  const schema =
    'Created_At:string, Started_At:string, Completed_At:string, MatrixName:string, MatrixValue:string, Result:string, IsDraft:boolean, JobLink:string';
  const options = {
    schema: schema,
    location: 'US',
    timePartitioning: {
      type: 'DAY',
      expirationMS: '7776000000',
      field: 'date',
    },
  };

  // Create a new table in the dataset
  const table = await client
    .dataset('github', { projectId: 'side-dw-dev' })
    .table('ci_analytics');

  core.info(`Retrieved table ${table.id}`);

  table.insert({
    created_at: createdAt,
    started_at: startedAt,
    completed_at: completedAt,
    matrix_name: matrixName,
    matrix_value: matrixValue,
    result: result,
    draft: draft,
    job_link: jobLink,
    repository: repository,
    workflow: workflow,
    job: job,
    actor: actor,
    run_id: runId,
    run_number: runNumber,
    sha: sha,
    event_name: eventName,
  });
}

/**
 * Action run pipeline
 */
async function pipeline(): Promise<void> {
  const createdAt = core.getInput(Inputs.CreatedAt);
  const startedAt = core.getInput(Inputs.StartedAt);
  const completedAt = core.getInput(Inputs.CompletedAt);
  const matrixName = core.getInput(Inputs.MatrixName);
  const matrixValue = core.getInput(Inputs.MatrixValue);
  const result = core.getInput(Inputs.Result);
  const draft = core.getInput(Inputs.Draft);
  const jobLink = core.getInput(Inputs.JobLink);

  const repository = context.repo.repo;
  const workflow = context.workflow;
  const job = context.job;
  const actor = context.actor;
  const runId = context.runId;
  const runNumber = context.runNumber;
  const sha = context.sha;
  const eventName = context.eventName;
  // Commented lines below are context details that doesn't seem to be supported by '@actions/github', will have a closer look soon.
  //const triggeringActor = context.triggeringActor;
  //const runAttempt = context.runAttempt
  //const headRef = context.headRef;
  //const baseRef = context.baseRef;
  //const runnerName = context.runnerName;
  //const runnerType = context.runnerType;

  core.info('Successfully triggering CI Analytics action');
  core.info(`createdAt: ${createdAt}`);
  core.info(`startedAt: ${startedAt}`);
  core.info(`completedAt: ${completedAt}`);
  core.info(`matrixName: ${matrixName}`);
  core.info(`matrixValue: ${matrixValue}`);
  core.info(`result: ${result}`);
  core.info(`draft: ${draft}`);
  core.info(`jobLink: ${jobLink}`);
  core.info(`repository: ${repository}`);
  core.info(`workflow: ${workflow}`);
  core.info(`job: ${job}`);
  core.info(`actor: ${actor}`);
  core.info(`runId: ${runId}`);
  core.info(`runNumber: ${runNumber}`);
  core.info(`sha: ${sha}`);
  core.info(`eventName: ${eventName}`);
  // core.info(`triggeringActor: ${triggeringActor}`);
  // core.info(`runAttempt: ${runAttempt}`);
  // core.info(`headRef: ${headRef}`);
  // core.info(`baseRef: ${baseRef}`);
  // core.info(`runnerName: ${runnerName}`);
  // core.info(`runnerType: ${runnerType}`);

  sendToBigQuery({
    createdAt,
    startedAt,
    completedAt,
    matrixName,
    matrixValue,
    result,
    draft,
    jobLink,
    repository,
    workflow,
    job,
    actor,
    runId,
    runNumber,
    sha,
    eventName,
  });
  core.info('Successfully Set CI Analytics in bigquery');
}

/**
 * Logs an error and fails the Github Action
 * @param err Any possible errors
 */
function handleError(err: Error): void {
  console.error(err);
  core.setFailed(err.message);
}

/**
 * Main function to execute the Github Action
 */
export async function run(): Promise<void> {
  process.on('unhandledRejection', handleError);
  await pipeline().catch(handleError);
  // ensures listener is removed after the run
  process.removeListener('unhandledRejection', handleError);
}
