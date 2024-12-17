import * as core from '@actions/core';
import { context } from '@actions/github';
import { BigQuery } from '@google-cloud/bigquery';
import { Inputs } from './inputs';

async function sendToBigQuery({
  createdAt,
  startedAt,
  completedAt,
}: {
  createdAt: string;
  startedAt: string;
  completedAt: string;
}): Promise<void> {
  const client = new BigQuery();

  const schema = 'Created_At:string, Started_At:string, Completed_At:string';
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
  });
}

/**
 * Action run pipeline
 */
async function pipeline(): Promise<void> {
  const createdAt = core.getInput(Inputs.CreatedAt);
  const startedAt = core.getInput(Inputs.StartedAt);
  const completedAt = core.getInput(Inputs.CompletedAt);

  const repository = context.repo.repo;

  core.info('Successfully triggering CI Analytics action');
  core.info(`createdAt: ${createdAt}`);
  core.info(`startedAt: ${startedAt}`);
  core.info(`completedAt: ${completedAt}`);

  sendToBigQuery({ createdAt, startedAt, completedAt });
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
