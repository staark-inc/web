import fs from "node:fs";

import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

const owner = process.env.GITHUB_OWNER ?? "staark-inc";
const repo = process.env.GITHUB_REPO ?? "web";
const branch = process.env.GITHUB_BRANCH ?? "main";

function getGitHubAppConfig() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKeyPath =
    process.env.GITHUB_PRIVATE_KEY_PATH;

  if (!appId) {
    throw new Error("GITHUB_APP_ID is missing.");
  }

  if (!privateKeyPath) {
    throw new Error(
      "GITHUB_PRIVATE_KEY_PATH is missing."
    );
  }

  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(
      `GitHub private key not found: ${privateKeyPath}`
    );
  }

  const privateKey = fs.readFileSync(
    privateKeyPath,
    "utf8"
  );

  return {
    appId,
    privateKey,
  };
}

async function getInstallationId() {
  const { appId, privateKey } =
    getGitHubAppConfig();

  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
    },
  });

  const installations =
    await appOctokit.apps.listInstallations({
      per_page: 100,
    });

  console.log(
    "GitHub App ID:",
    appId
  );

  console.log(
    "GitHub installations:",
    installations.data.map(
      (installation) => ({
        id: installation.id,
        account:
          installation.account &&
          "login" in installation.account
            ? installation.account.login
            : null,
        type:
          installation.account &&
          "type" in installation.account
            ? installation.account.type
            : null,
        repositorySelection:
          installation.repository_selection,
      })
    )
  );

  const installation =
    installations.data.find(
      (item) =>
        item.account &&
        "login" in item.account &&
        item.account.login.toLowerCase() ===
          owner.toLowerCase()
    );

  if (!installation) {
    throw new Error(
      `GitHub App is not installed on "${owner}".`
    );
  }

  return installation.id;
}

export async function getGitHubClient() {
  const { appId, privateKey } =
    getGitHubAppConfig();

  const installationId =
    await getInstallationId();

  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    },
  });

  return {
    octokit,
    installationId,
  };
}

export async function getGitHubOverview() {
  const { octokit, installationId } =
    await getGitHubClient();

  const [
    repositoryResult,
    branchResult,
    workflowResult,
  ] = await Promise.all([
    octokit.repos.get({
      owner,
      repo,
    }),

    octokit.repos.getBranch({
      owner,
      repo,
      branch,
    }),

    octokit.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      branch,
      per_page: 1,
    }),
  ]);

  const repository = repositoryResult.data;
  const branchData = branchResult.data;

  const commitResult =
    await octokit.repos.getCommit({
      owner,
      repo,
      ref: branchData.commit.sha,
    });

  const commit = commitResult.data;

  const workflow =
    workflowResult.data.workflow_runs[0] ?? null;

  return {
    connected: true,

    installationId,

    repository: {
      owner,
      name: repository.name,
      fullName: repository.full_name,
      private: repository.private,
      url: repository.html_url,
      defaultBranch:
        repository.default_branch,
    },

    branch: {
      name: branch,
      protected: branchData.protected,
    },

    commit: {
      sha: commit.sha,
      shortSha: commit.sha.slice(0, 7),

      message:
        commit.commit.message
          .split("\n")[0]
          .trim(),

      author:
        commit.commit.author?.name ??
        commit.author?.login ??
        "Unknown",

      date:
        commit.commit.author?.date ??
        null,

      url: commit.html_url,
    },

    workflow: workflow
      ? {
          id: workflow.id,
          name: workflow.name,
          status: workflow.status,
          conclusion: workflow.conclusion,
          branch: workflow.head_branch,
          sha: workflow.head_sha,
          event: workflow.event,
          createdAt: workflow.created_at,
          updatedAt: workflow.updated_at,
          url: workflow.html_url,
        }
      : null,
  };
}