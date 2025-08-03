'use client';

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function JenkinsfileGenerator() {
  const [pipelineName, setPipelineName] = useState('');
  const [description, setDescription] = useState('');
  const [gitRepo, setGitRepo] = useState('');
  const [branches, setBranches] = useState('');
  const [pollSCM, setPollSCM] = useState(false);
  const [githubCreds, setGithubCreds] = useState('');
  const [buildCommand, setBuildCommand] = useState(
    'npm install && npm run build'
  );
  const [dockerBuild, setDockerBuild] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [envVars, setEnvVars] = useState('');
  const [jenkinsfile, setJenkinsfile] = useState('');
  const [responseMsg, setResponseMsg] = useState('');

  const generateJenkinsfile = () => {
    let file = 'pipeline {\n';
    file += `  agent any\n`;

    file += `  parameters {\n`;
    const filteredBranches: string[] = branches
      .replace(/\s+/g, '')
      .split(',')
      .filter((item) => item !== '');
    file += `    choice(name: 'BRANCH_NAME', description: 'The Git branch to build', choices:[`;
    file += filteredBranches.map((branch) => `'${branch}'`).join(', ');
    file += `])\n`;
    file += `  }\n`;

    if (pollSCM) {
      file += `  triggers {\n`;
      file += `    pollSCM('* * * * *')\n`;
      file += `  }\n`;
    }

    file += `  options {\n`;
    file += `timestamps()\n`;
    file += `  }\n`;

    if (envVars.trim()) {
      file += `  environment {\n`;
      envVars.split('\n').forEach((line) => {
        if (line.trim()) file += `    ${line.trim()}\n`;
      });
      file += `  }\n`;
    }

    file += `  stages {\n`;

    file += `    stage('Checkout') {\n`;
    file += `      steps {\n`;
    // If GitHub credentials are provided, use them in the git step
    if (githubCreds.trim()) {
      file +=
        '        git branch: "${params.BRANCH_NAME}", ' +
        `credentialsId: '${githubCreds}', url: 'https://github.com/dzakyadlh/test.git'\n`;
    } else {
      file +=
        '        git branch: "${params.BRANCH_NAME}", ' + `url: '${gitRepo}'\n`;
    }
    file += `      }\n`;
    file += `    }\n`;

    file += `    stage('Build') {\n`;
    file += `      steps {\n`;
    file += `        script {\n`;
    file += `          if (isUnix()) {\n`;
    file += `            sh '''\n${buildCommand}\n'''\n`;
    file += `          } else {\n`;
    file += `            bat '''\n${buildCommand}\n'''\n`;
    file += `          }\n`;
    file += `        }\n`;
    file += `      }\n`;
    file += `    }\n`;

    file += `  }\n`;

    if (notifyEmail.trim()) {
      file += `  post {\n`;
      file += `    success {\n`;
      file += `      mail to: '${notifyEmail}', subject: 'Build Success', body: 'The Jenkins build completed successfully.'\n`;
      file += `    }\n`;
      file += `    failure {\n`;
      file += `      mail to: '${notifyEmail}', subject: 'Build Failed', body: 'The Jenkins build failed. Please check logs.'\n`;
      file += `    }\n`;
      file += `  }\n`;
    }

    file += `}\n`;
    setJenkinsfile(file);
  };

  const sendToJenkins = async () => {
    const res = await fetch('/api/jenkins/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobName: pipelineName || `pipeline-${Date.now()}`,
        description,
        jenkinsfile,
        githubCreds,
        gitRepo,
        branches,
      }),
    });
    const data = await res.json();
    setResponseMsg(data.message || 'Pipeline creation attempted.');
  };

  const downloadFile = () => {
    const blob = new Blob([jenkinsfile], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Jenkinsfile';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <CardTitle className="text-xl font-semibold mb-5">
            Jenkins Pipeline Generator{' '}
          </CardTitle>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Pipeline name"
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
          />
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <hr className="my-5" />

          <Label htmlFor="gitRepositoryURL">Git Repository URL</Label>
          <Input
            id="gitRepositoryURL"
            placeholder="Git repository URL"
            value={gitRepo}
            onChange={(e) => setGitRepo(e.target.value)}
          />
          <Label htmlFor="githubCredentials">
            Github Credentials ID (if it is a private repository)
          </Label>
          <Input
            id="githubCredentials"
            placeholder="Git credentials ID"
            value={githubCreds}
            onChange={(e) => setGithubCreds(e.target.value)}
          />
          <Label htmlFor="branches">
            Branches (comma-separated, e.g., main, develop)
          </Label>
          <Input
            id="branches"
            placeholder="Branches (comma-separated, e.g., main, develop)"
            value={branches}
            onChange={(e) => setBranches(e.target.value)}
          />

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={pollSCM}
              onChange={(e) => setPollSCM(e.target.checked)}
            />
            <span className="text-sm">Enable Poll SCM Trigger</span>
          </label>

          <hr className="my-5" />

          <Label htmlFor="buildCommand">Build Command</Label>
          <Textarea
            id="buildCommand"
            placeholder="Build command"
            value={buildCommand}
            onChange={(e) => setBuildCommand(e.target.value)}
          />
          <Label htmlFor="envVariables">Environment Variables</Label>
          <Textarea
            id="envVariables"
            placeholder="Environment variables (e.g., NODE_ENV='production')"
            value={envVars}
            onChange={(e) => setEnvVars(e.target.value)}
          />

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={dockerBuild}
              onChange={(e) => setDockerBuild(e.target.checked)}
            />
            <span className="text-sm">Include Docker build stage</span>
          </label>

          <hr className="my-5" />

          <Label htmlFor="notifyEmail">Notification Email</Label>
          <Input
            id="notifyEmail"
            placeholder="Notification email"
            value={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.value)}
          />

          <Button onClick={generateJenkinsfile} className="mt-5">
            Generate Jenkinsfile
          </Button>
        </CardContent>
      </Card>

      {jenkinsfile && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-bold">Generated Jenkinsfile</h2>
            <Textarea className="font-mono h-96" readOnly value={jenkinsfile} />
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={downloadFile}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Jenkinsfile
              </Button>
              <Button variant="default" onClick={sendToJenkins}>
                Deploy to Jenkins
              </Button>
            </div>
            {responseMsg && (
              <p className="text-sm text-green-700">{responseMsg}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
