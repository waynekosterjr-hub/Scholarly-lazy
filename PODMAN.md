# Run ScholarDesk with Podman on Windows

Podman runs a container image. Build that image from this folder's `Containerfile`; a separately downloaded image file is not required. Building downloads the Node base image and npm dependencies. The resulting image is stored in Podman's local image storage.

## Prepare Podman

### Windows prerequisites

Run `wsl --status` before initializing the Podman machine. If Windows reports that WSL 2 is unsupported because Virtual Machine Platform is disabled, open **PowerShell as Administrator** and run:

```powershell
wsl --install --no-distribution
```

Restart Windows after the feature installation succeeds. No Ubuntu installation is needed; Podman creates its own Linux machine. Do not run the build/run commands if machine initialization or startup fails.

If initialization reports a missing `Virtualization\GuestCommunicationServices` registry key, check the selected provider. An incomplete Hyper-V installation can cause this error. For WSL, set `[machine]` / `provider="wsl"` in the Podman provider configuration under `%APPDATA%\containers\containers.conf.d\99-podman-machine-provider.conf`, preserving a backup of the original. The current development computer has been switched to this WSL configuration. Enabling Windows features still requires Administrator access and a restart.

Reference: [Microsoft WSL commands](https://learn.microsoft.com/en-us/windows/wsl/basic-commands).

Install [Podman Desktop](https://podman-desktop.io/downloads) and complete its Podman engine setup, or install the [Podman CLI](https://podman.io/docs/installation). Open a new PowerShell window afterward.

Check the Linux virtual machine that Podman uses on Windows:

```powershell
podman machine list
```

If there is no machine, run `podman machine init`. If your machine is stopped, run `podman machine start` (add its name if using a non-default machine). Podman Desktop can also create and start it.

## Build and run

Open PowerShell in this project folder:

```powershell
Set-Location -LiteralPath 'C:\Users\Wayne Koster Jr\source\repos\ScholarDesk'
podman build --format docker -t localhost/scholardesk:local -f Containerfile .
podman run -d --name scholardesk -p 127.0.0.1:3001:3000 -v "${PWD}/.env.local:/app/.env.local:ro" localhost/scholardesk:local
```

Open **http://localhost:3001**. Host port 3001 avoids conflicting with the development server already using 3000. This binding makes the app accessible only from this computer.

The existing `.env.local` is mounted read-only at runtime so dotenv can read it, including quoted values. It is excluded from the build context and never copied into the image. Keep `PORT` unset or `3000` in that file. The container starts the built production server, not the development server.

If the mount fails, make sure `.env.local` exists in your current project directory and that this Windows directory is accessible to your Podman machine. Podman supports Windows host paths for bind mounts.

## Daily commands

```powershell
podman logs -f scholardesk
podman stop scholardesk
podman start scholardesk
```

The last two commands stop and start the same container. To rebuild after code changes:

```powershell
podman build --format docker -t localhost/scholardesk:local -f Containerfile .
podman stop scholardesk
podman rm scholardesk
podman run -d --name scholardesk -p 127.0.0.1:3001:3000 -v "${PWD}/.env.local:/app/.env.local:ro" localhost/scholardesk:local
```

## Login and drafts

Firebase login and cloud saves continue using the configured Firebase project. The browser needs network access to Google/Firebase, and the container needs network access for AI and scholarly search. If Firebase reports an unauthorized domain, check that `localhost` is authorized in Firebase Authentication settings.

Browser-local drafts and saved student details are scoped to the website address, including the port. Opening port 3001 will not display the local-only cache from port 3000. Confirm drafts are saved to the cloud or export them before switching. To keep the original browser storage, stop the development server yourself and publish `127.0.0.1:3000:3000` instead.

No paper storage volume is required: the app stores drafts in browser storage and Firebase, not in the container filesystem. Downloaded exports are saved by your browser.

## Optional image file for another computer

```powershell
podman save -o scholardesk-image.tar localhost/scholardesk:local
# On the other computer:
podman load -i scholardesk-image.tar
```

The other computer needs Podman and its own runtime configuration. Do not include your `.env.local` when sharing the image. Saving an image does not include runtime bind mounts.

This is a containerized browser application, not the planned Windows desktop executable. It still uses whichever AI credentials are supplied at runtime; user billing and managed AI onboarding have not been implemented.

References: [Podman build](https://docs.podman.io/en/stable/markdown/podman-build.1.html), [Podman for Windows](https://github.com/podman-container-tools/podman/blob/main/docs/tutorials/podman-for-windows.md), [Podman run](https://docs.podman.io/en/stable/markdown/podman-run.1.html).
