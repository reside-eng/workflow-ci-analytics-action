import * as core from '@actions/core';
import { context } from '@actions/github';
import { BigQuery } from '@google-cloud/bigquery';
import { Inputs } from './inputs';

export type AnalyticsObject = {
  created_at: string;
  started_at: string;
  completed_at: string;
  matrix_name: string;
  matrix_value: string;
  result: string;
  draft: string;
  job_link: string;
  repository: string;
  workflow: string;
  job: string;
  actor: string;
  run_id: number;
  run_number: number;
  sha: string;
  event_name: string;
  run_attempt: number;
  job_duration: number;
  run_duration: number;
  env: string;
  triggering_actor: string;
  head_ref: string;
  base_ref: string;
  runner_name: string;
  runner_type: string;
};

async function sendToBigQuery(
  analyticsObject: AnalyticsObject,
  projectId: string,
  datasetName: string,
  tableName: string,
): Promise<void> {
  const client = new BigQuery();

  const schema =
    'Created_At:string, Started_At:string, Completed_At:string, MatrixName:string, MatrixValue:string, Result:string, Draft:boolean, JobLink:string';
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
    .dataset(datasetName, { projectId })
    .table(tableName);

  core.info(`Retrieved table ${table.id}`);

  table.insert(analyticsObject);
}

/**
 * Action run pipeline
 */
async function pipeline(): Promise<void> {
  core.info('Successfully triggering CI Analytics action');
  const projectId = core.getInput(Inputs.ProjectId, { required: true });
  const dataset = core.getInput(Inputs.Dataset, { required: true });
  const table = core.getInput(Inputs.Table, { required: true });
  const createdAt = core.getInput(Inputs.CreatedAt, { required: true });
  const startedAt = core.getInput(Inputs.StartedAt, { required: true });
  const completedAt = core.getInput(Inputs.CompletedAt, { required: true });
  const matrixName = core.getInput(Inputs.MatrixName);
  const matrixValue = core.getInput(Inputs.MatrixValue);
  const result = core.getInput(Inputs.Result, { required: true });
  const draft = core.getInput(Inputs.Draft);
  const jobLink = core.getInput(Inputs.JobLink);
  const triggeringActor = core.getInput(Inputs.TriggeringActor);
  const runAttempt = Number(
    core.getInput(Inputs.RunAttempt, { required: true }),
  );
  const headRef = core.getInput(Inputs.HeadRef);
  const baseRef = core.getInput(Inputs.BaseRef);
  const runnerType = core.getInput(Inputs.RunnerType, { required: true });
  const runnerName = core.getInput(Inputs.RunnerName, { required: true });

  const {
    repo: { repo: repository },
    workflow,
    job,
    actor,
    runId,
    runNumber,
    sha,
    eventName,
  } = context;

  const createdAtDate: Date = new Date(createdAt);
  const startedAtDate: Date = new Date(startedAt);
  const completedAtDate: Date = new Date(completedAt);
  if (
    Number.isNaN(createdAtDate.getTime()) ||
    Number.isNaN(startedAtDate.getTime()) ||
    Number.isNaN(completedAtDate.getTime())
  ) {
    throw new Error('Invalid date');
  }

  const jobDuration: number = Math.floor(
    Math.abs(completedAtDate.getTime() - createdAtDate.getTime()) / 1000,
  );
  const runDuration: number = Math.floor(
    Math.abs(completedAtDate.getTime() - startedAtDate.getTime()) / 1000,
  );

  const env: string = process.env.ENV ?? '';

  const analyticsObject = {
    created_at: createdAt,
    started_at: startedAt,
    completed_at: completedAt,
    matrix_name: matrixName,
    matrix_value: matrixValue,
    result,
    draft,
    job_link: jobLink,
    repository,
    workflow,
    job,
    actor,
    run_id: runId,
    run_number: runNumber,
    run_attempt: runAttempt,
    sha,
    event_name: eventName,
    env,
    triggering_actor: triggeringActor,
    head_ref: headRef,
    base_ref: baseRef,
    runner_name: runnerName,
    runner_type: runnerType,
    job_duration: jobDuration,
    run_duration: runDuration,
  };
  core.info('Analytics Object: ');
  core.info(JSON.stringify(analyticsObject, null, 2));

  await sendToBigQuery(analyticsObject, projectId, dataset, table);
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
