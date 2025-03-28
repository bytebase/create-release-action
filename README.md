# About

Github action to create a release on Bytebase.

- Tutorial:
  [Database GitOps with GitHub Actions](https://www.bytebase.com/docs/tutorials/gitops-github-workflow/)
- Sample repo: https://github.com/bytebase/example-gitops-github-flow

# Naming scheme

The migration files matched by `file-pattern` are assumed to follow a naming
scheme. It should start with digit version numbers, separated by underscore, and
optionally end with a change type. Format:
`path/to/migrations/<<version>>_xxxx_<<changeType>>.sql` This action determines
the change type of a file by how its filename ends. The default change type is
schema change.

Examples:

- 20250101001_add_column.sql
- 20250101002_fill_default_data_dml.sql

| Ends with | Type                 |
| --------- | -------------------- |
| ddl       | schema change        |
| ghost     | online schema change |
| dml       | data change          |

# Inputs

| Input Name    | Required | Default Value   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Type    |
| ------------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| url           | Yes      | N/A             | The bytebase URL.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | String  |
| token         | Yes      | N/A             | The Bytebase access token.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | String  |
| project       | Yes      | N/A             | The project on Bytebase. Format: projects/{project}                                                                                                                                                                                                                                                                                                                                                                                                                                                                | String  |
| file-pattern  | Yes      | N/A             | The file pattern matching migration files. Example: migrations/prod/\*.sql                                                                                                                                                                                                                                                                                                                                                                                                                                         | String  |
| check-release | No       | `FAIL_ON_ERROR` | Whether to run checks on the release Valid values are: `SKIP`, `FAIL_ON_WARNING`, `FAIL_ON_ERROR`. `targets` must be provided if `check-release` is set to `FAIL_ON_ERROR` or `FAIL_ON_WARNING`.                                                                                                                                                                                                                                                                                                                   | String  |
| validate-only | No       | `false`         | Used to check release only. Won't create the release.                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Boolean |
| targets       | No       | N/A             | The database group or databases to check the release against. This must be provided if `check-release` is set to `FAIL_ON_ERROR` or `FAIL_ON_WARNING`. Either a comma separated list of the databases or a database group. Databases example: `instances/mysql1/databases/db1,instances/mysql1/databases/db2`. Database format: instances/{instance}/databases/{database} Database group example: `projects/exa/databaseGroups/mygroup` Database group format: `projects/{project}/databaseGroups/{databaseGroup}` | String  |

## Example

```yaml
on:
  push:
    branches:
      - main

jobs:
  bytebase-cicd:
    runs-on: ubuntu-latest
    env:
      BYTEBASE_URL: 'https://demo.bytebase.com'
      BYTEBASE_PROJECT: 'projects/example'
      BYTEBASE_SERVICE_ACCOUNT: 'demo@service.bytebase.com'
    name: Bytebase cicd
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Login to Bytebase
        id: login
        uses: bytebase/login-action@main
        with:
          url: ${{ env.BYTEBASE_URL }}
          service-account: ${{ env.BYTEBASE_SERVICE_ACCOUNT }}
          service-account-key: ${{ secrets.BYTEBASE_PASSWORD }}
      - name: Create release
        id: create_release
        uses: bytebase/create-release-action@main
        with:
          url: ${{ env.BYTEBASE_URL }}
          token: ${{ steps.login.outputs.token }}
          project: ${{ env.BYTEBASE_PROJECT }}
          file-pattern: 'migrations/*.sql'
          check-release: 'FAIL_ON_ERROR'
          validate-ony: false # set to true to check release only
          targets: 'instances/mysql/databases/db1'
```
