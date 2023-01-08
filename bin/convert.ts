// @see https://scrapbox.io/takker/Deno%E3%81%8B%E3%82%89Google_Apps_Script%E3%81%AE%E5%9E%8B%E5%AE%9A%E7%BE%A9%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%82%92%E4%BD%BF%E3%81%88%E3%82%8B%E3%81%8B%E8%A9%A6%E3%81%99

import { Octokit } from "octokit";
import * as fs from "std/fs/mod.ts";
import * as path from "std/path/mod.ts";

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));

const baseDir = path.join(__dirname, "../types");

const octokit = new Octokit();

const main = async () => {
  await fs.emptyDir(baseDir);
  await expand("types/google-apps-script", baseDir);
};

const expand = async (contentPath: string, dir: string) => {
  const options = {
    owner: "DefinitelyTyped",
    repo: "DefinitelyTyped",
    ref: "master",
  };

  const { data } = await octokit.rest.repos.getContent({
    path: contentPath,
    ...options,
  });

  for (const content of data) {
    const p = path.join(dir, content.name);
    console.log(p);

    if (content.type === "dir") {
      await fs.ensureDir(p);
      await expand(content.path, p);
    } else if (path.extname(content.name) === ".ts") {
      const res = await fetch(content.download_url);
      const code = await res.text();

      await Deno.writeTextFile(
        p,
        code.replace(
          /\/\/\/\s*<reference\s*path="([^"]+)"\s*\/>/g,
          '/// <reference types="./$1" />',
        ),
      );
    }
  }
};

main()
  .then(() => Deno.exit(0))
  .catch((err) => {
    console.error(err);
    Deno.exit(1);
  });
