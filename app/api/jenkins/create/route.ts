import { NextResponse } from 'next/server';

export async function POST(req: any) {
  // Use req.json() to parse the body
  const { jobName, jenkinsfile } = await req.json();

  // Make sure to handle the case where jenkinsfile is still undefined or null
  // This is a good defensive programming practice
  if (!jenkinsfile) {
    return NextResponse.json(
      { message: 'Jenkinsfile content is missing.' },
      { status: 400 }
    );
  }

  const JENKINS_URL = process.env.JENKINS_URL;
  const JENKINS_USER = process.env.JENKINS_USER;
  const JENKINS_TOKEN = process.env.JENKINS_TOKEN;

  const configXml = `
<flow-definition plugin="workflow-job">
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps">
    <script>${jenkinsfile
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</script>
    <sandbox>true</sandbox>
  </definition>
</flow-definition>`;

  try {
    const response = await fetch(`${JENKINS_URL}/createItem?name=${jobName}`, {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(`${JENKINS_USER}:${JENKINS_TOKEN}`).toString('base64'),
        'Content-Type': 'application/xml',
      },
      body: configXml,
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ message: `Failed: ${errText}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        message: `Pipeline job '${jobName}' created successfully.`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        message: 'Error communicating with Jenkins',
        error: err.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
