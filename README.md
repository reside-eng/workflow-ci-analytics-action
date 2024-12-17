# Workflow CI Analytics Action

> Github action that sends data around the ci job to big query

## How it works

At the end of a workflow call this action to send ci analytics to big query

## Usage

<!-- start usage -->
<!-- Warning: Content between these comments is auto-generated. Do NOT manually edit. -->
```yaml
- uses: reside-eng/workflow-ci-analytics-action@v1
  with:
    # Timestamp when the job was created
    #
    # Required: true
    created_at: ''

    # Timestamp when the job was started
    #
    # Required: true
    started_at: ''

    # Timestamp when the job was completed
    #
    # Required: true
    completed_at: ''
```
<!-- end usage -->

## Examples

### Basic

```yaml
name: Build

on:
  pull_request:
    branches:
      - main

jobs:
  build:
    name: build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      # Your steps...

  notification:
    if: always()
    name: notification
    needs: [build]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - uses: technote-space/workflow-conclusion-action@v2.0.1

      - uses: reside-eng/workflow-ci-analytics-action@v1.0.0
        with:
          created_at: timestamp
          started_at: timestamp
          completed_at: timestamp
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

# Local development

Please install gh CLI:
<https://github.com/cli/cli#installation>

In order to run the tests, you'll need to configure authentication using your gh CLI:

```bash
gh auth refresh
```

You'll be prompted with a one-time code, copy this one.
Then click on enter, a web page will open in your browser.
Paste the code previously copied.
Click on `Authorize github`
You're all set !

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
