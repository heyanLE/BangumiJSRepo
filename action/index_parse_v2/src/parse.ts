import * as fs from 'fs';


const repoUrl = "https://raw.githubusercontent.com/heyanLE/BangumiJSRepo/refs/heads/public/repository/v2"

const folder = "../..";
const repositoryFolder = "../../repository/";
const indexFolder = "../../repository/v2/";
const indexFile = "../../repository/v2/index.jsonl";

type ExtensionRemote = {
    key: string;
    url: string;
    label: string;
    versionCode: number;
    versionName: string;
}

async function main() {
    await mkdirs(repositoryFolder);
    await mkdirs(indexFolder);
    const files = await lists(folder);
    let extensions: ExtensionRemote[] = [];
    console.log("Found " + files.length + " files in " + folder);
    for (const file of files) {
        console.log("Processing " + file);
        if (file.endsWith(".js")) {
            const content = await read(folder + "/" + file);
            let map = new Map<string, string>();
            if (content) {
                const lines = content.toString().split("\n");
                for (const line of lines) {
                    console.log("Found line: " + line);
                    // @key heyanle.ggl
                    if (!line.startsWith("//")) break;
                    const trimmedLine = line.trim().substring(2).trim();
                    if (!trimmedLine.startsWith("@")) continue;
                    const parts = trimmedLine.split(" ");
                    console.log("Found parts: " + parts);
                    if (parts.length < 2) continue;
                    const key = parts[0].substring(1); // Remove '@'
                    const value = parts.slice(1).join(" "); // Join the rest as value
                    map.set(key, value);
                }
            }

            let key = map.get("key");
            let url = repoUrl + "/" + file;
            let label = map.get("label") || "Unknown";
            let versionCode = parseInt(map.get("versionCode") || "0");
            let versionName = map.get("versionName") || "0.0.0";

            if (!key) {
                console.log("No key found in " + file);
                continue;
            }

            const remote: ExtensionRemote = {
                key: key,
                url: url,
                label: label,
                versionCode: versionCode,
                versionName: versionName
            };
            const targetFile = indexFolder + "/" + key + ".js";
            await copyFile(folder + "/" + file, targetFile);
            extensions.push(remote);
        }
    }

    await deleteFile(indexFile);
    const indexContent = extensions.map(ext => JSON.stringify(ext)).join("\n");
    console.log("indexContent: " + indexContent);
    await writeToFile(indexFile, indexContent);
}

function lists(path: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
}

function mkdirs(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.mkdir(path, () => {
            resolve();
        })
    });
}

function deleteFile(file: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.rm(file, () => {
            resolve()
        })
    });
}

function writeToFile(file: string, data: Buffer|string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, data, () => {
            resolve(file);
        })
    });
}

function read(file: string): Promise<Buffer | NodeJS.ErrnoException | null> {
    return new Promise((resolve, reject) => {
        fs.readFile(file, (err, data) => {
            resolve(data)
        
        })
    });
}

function copyFile(source: string, destination: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.copyFile(source, destination, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

main();