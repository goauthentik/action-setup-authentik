import * as exec from "@actions/exec";

export class ComposeCommand {
  constructor(
    private readonly envFile: string,
    readonly composeFiles: string[],
  ) {}

  addComposeFile(filePath: string): void {
    this.composeFiles.push(filePath);
  }

  private baseArgs(): string[] {
    const args = ["compose", "-p", "authentik", "--env-file", this.envFile];
    for (const f of this.composeFiles) {
      args.push("-f", f);
    }
    return args;
  }

  async pull(): Promise<void> {
    await exec.exec("docker", [...this.baseArgs(), "pull", "-q"]);
  }

  async listImages(): Promise<string[]> {
    let output = "";
    await exec.exec("docker", [...this.baseArgs(), "config", "--images"], {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
      },
    });
    const images = output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    return [...new Set(images)].sort();
  }

  async up(): Promise<void> {
    await exec.exec("docker", [...this.baseArgs(), "up", "-d", "--wait"]);
  }

  async containerIdByLabel(service: string): Promise<string> {
    let output = "";
    await exec.exec(
      "docker",
      [
        "ps",
        "-f",
        "label=com.docker.compose.project=authentik",
        "-f",
        `label=com.docker.compose.service=${service}`,
        "--format",
        "{{.ID}}",
      ],
      {
        listeners: {
          stdout: (data: Buffer) => {
            output += data.toString();
          },
        },
      },
    );
    return output.trim();
  }

  async execInService(service: string, cmd: string[]): Promise<void> {
    await exec.exec("docker", [...this.baseArgs(), "exec", service, ...cmd]);
  }

  async logs(): Promise<void> {
    await exec.exec("docker", [...this.baseArgs(), "logs"]);
  }
}
