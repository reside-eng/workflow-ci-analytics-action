import * as core from '@actions/core';
import { BigQuery } from '@google-cloud/bigquery';
import {
  type MockInstance,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { Inputs } from './inputs'; // Adjust the path to your Inputs enum
import { type AnalyticsObject, run } from './main'; // Adjust the path to your action file

vi.mock('@actions/core');
vi.mock('@google-cloud/bigquery');

process.env.ENV = 'test';

const mockExpectedAnalytics: AnalyticsObject = vi.hoisted(() => ({
  created_at: '2024-12-18T00:00:00Z',
  started_at: '2024-12-18T00:05:00Z',
  completed_at: '2024-12-18T00:10:00Z',
  matrix_name: '  matrix_name',
  matrix_value: 'matrix_value',
  result: 'result',
  draft: 'draft',
  job_link: 'job_link',
  repository: 'example-repo',
  workflow: 'workflow',
  job: 'job',
  actor: 'actor',
  run_id: 1234,
  run_number: 2,
  sha: 'sha',
  event_name: 'event_name',
  run_attempt: 10,
  job_duration: 600,
  run_duration: 300,
  env: 'test',
  triggering_actor: 'triggering_actor',
  head_ref: 'head_ref',
  base_ref: 'base_ref',
  runner_name: 'runner_name',
  runner_type: 'runner_type',
}));

describe('GitHub Action - CI Analytics', () => {
  let coreGetInputSpy: MockInstance;

  beforeEach(() => {
    coreGetInputSpy = vi
      .spyOn(core, 'getInput')
      .mockImplementation((name: string) => {
        if (Object.values(Inputs).includes(name as Inputs)) {
          switch (name) {
            case Inputs.CreatedAt:
              return mockExpectedAnalytics.created_at;
            case Inputs.StartedAt:
              return mockExpectedAnalytics.started_at;
            case Inputs.CompletedAt:
              return mockExpectedAnalytics.completed_at;
            case Inputs.MatrixName:
              return mockExpectedAnalytics.matrix_name;
            case Inputs.MatrixValue:
              return mockExpectedAnalytics.matrix_value;
            case Inputs.Result:
              return mockExpectedAnalytics.result;
            case Inputs.Draft:
              return mockExpectedAnalytics.draft;
            case Inputs.JobLink:
              return mockExpectedAnalytics.job_link;
            case Inputs.TriggeringActor:
              return mockExpectedAnalytics.triggering_actor;
            case Inputs.RunAttempt:
              return mockExpectedAnalytics.run_attempt.toString();
            case Inputs.HeadRef:
              return mockExpectedAnalytics.head_ref;
            case Inputs.BaseRef:
              return mockExpectedAnalytics.base_ref;
            case Inputs.RunnerType:
              return mockExpectedAnalytics.runner_type;
            case Inputs.RunnerName:
              return mockExpectedAnalytics.runner_name;
            default:
              return 'mocked-value';
          }
        }
        throw new Error(`Unknown input: ${name}`);
      });
  });

  it('should log analytics object and send data to BigQuery', async () => {
    // Mock core.info
    const coreInfoSpy = vi.spyOn(core, 'info');

    // Mock context
    vi.mock('@actions/github', () => ({
      context: {
        repo: {
          repo: mockExpectedAnalytics.repository,
        },
        workflow: mockExpectedAnalytics.workflow,
        job: mockExpectedAnalytics.job,
        actor: mockExpectedAnalytics.actor,
        runId: mockExpectedAnalytics.run_id,
        runNumber: mockExpectedAnalytics.run_number,
        sha: mockExpectedAnalytics.sha,
        eventName: mockExpectedAnalytics.event_name,
      },
    }));

    // Mock BigQuery and its methods
    const insertMock = vi.fn();
    const tableMock = {
      id: 'table-id',
      insert: insertMock,
    };
    const datasetMock = {
      table: vi.fn(() => tableMock),
    };
    const bigQueryMock = {
      dataset: vi.fn(() => datasetMock),
    };
    vi.mocked(BigQuery).mockImplementation(() => bigQueryMock as any);

    // Run the action
    await run();

    // Validate logs
    expect(coreInfoSpy).toHaveBeenCalledWith(
      'Successfully triggering CI Analytics action',
    );
    expect(coreInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Analytics Object: '),
    );
    // expect(coreInfoSpy).toHaveBeenCalledWith(
    //   JSON.stringify(mockExpectedAnalytics, null, 2)
    // );
    expect(JSON.parse(coreInfoSpy.mock.calls[2][0])).toMatchObject(
      mockExpectedAnalytics,
    );
    expect(coreInfoSpy).toHaveBeenCalledWith(
      'Successfully Set CI Analytics in bigquery',
    );

    // Validate BigQuery interaction
    expect(bigQueryMock.dataset).toHaveBeenCalledWith('github', {
      projectId: 'side-dw',
    });
    expect(datasetMock.table).toHaveBeenCalledWith('ci_analytics');
    expect(insertMock).toHaveBeenCalledWith(mockExpectedAnalytics);

    // Validate input
    expect(coreGetInputSpy).toHaveBeenCalledWith('created_at', {
      required: true,
    });
  });

  it('should handle errors and fail the action', async () => {
    const errorMessage = 'Test error';
    const coreSetFailedSpy = vi.spyOn(core, 'setFailed');

    // Mock BigQuery to throw an error
    vi.mocked(BigQuery).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    await run();

    // Validate failure logging
    expect(coreSetFailedSpy).toHaveBeenCalledWith(errorMessage);
  });

  it('should throw an error for invalid date', async () => {
    const coreSetFailedSpy = vi.spyOn(core, 'setFailed');
    coreGetInputSpy = vi
      .spyOn(core, 'getInput')
      .mockImplementation((name: string) => {
        if (Object.values(Inputs).includes(name as Inputs)) {
          switch (name) {
            case Inputs.CreatedAt:
            case Inputs.StartedAt:
            case Inputs.CompletedAt:
              return 'invalid-date';
            default:
              return 'mocked-value';
          }
        }
        throw new Error(`Unknown input: ${name}`);
      });

    await run();

    // Validate failure logging
    expect(coreSetFailedSpy).toHaveBeenCalledWith('Invalid date');
  });
});
