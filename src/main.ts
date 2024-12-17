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
}: {
  createdAt: string;
  startedAt: string;
  completedAt: string;
  matrixName: string;
  matrixValue: string;
  result: string;
  draft: string;
  jobLink: string;
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
    Created_At: createdAt,
    Started_At: startedAt,
    Completed_At: completedAt,
    MatrixName: matrixName,
    MatrixValue: matrixValue,
    Result: result,
    Draft: draft,
    JobLink: jobLink,
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

  core.info('Successfully triggering CI Analytics action');
  core.info(`createdAt: ${createdAt}`);
  core.info(`startedAt: ${startedAt}`);
  core.info(`completedAt: ${completedAt}`);
  core.info(`matrixName: ${matrixName}`);
  core.info(`matrixValue: ${matrixValue}`);
  core.info(`result: ${result}`);
  core.info(`draft: ${draft}`);
  core.info(`jobLink: ${jobLink}`);

  sendToBigQuery({
    createdAt,
    startedAt,
    completedAt,
    matrixName,
    matrixValue,
    result,
    draft,
    jobLink,
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
