"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const fs_1 = __importDefault(require("fs"));
function allReleases(github) {
    const params = Object.assign({ per_page: 100 }, github_1.context.repo);
    return github.paginate.iterator(github.repos.listReleases.endpoint.merge(params));
}
function createRelease(tagName, releaseName, body, commitish, draft = true, prerelease = true) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.GITHUB_TOKEN === undefined) {
            throw new Error('GITHUB_TOKEN is required');
        }
        // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
        const github = github_1.getOctokit(process.env.GITHUB_TOKEN);
        // Get owner and repo from context of payload that triggered the action
        const { owner, repo } = github_1.context.repo;
        const bodyPath = core.getInput('body_path', { required: false });
        let bodyFileContent = null;
        if (bodyPath !== '' && !!bodyPath) {
            try {
                bodyFileContent = fs_1.default.readFileSync(bodyPath, { encoding: 'utf8' });
            }
            catch (error) {
                core.setFailed(error.message);
            }
        }
        let release = null;
        try {
            // you can't get a an existing draft by tag
            // so we must find one in the list of all releases
            if (draft) {
                console.log(`Looking for a draft release with tag ${tagName}...`);
                try {
                    for (var _b = __asyncValues(allReleases(github)), _c; _c = yield _b.next(), !_c.done;) {
                        const response = _c.value;
                        let releaseWithTag = response.data.find(release => release.tag_name === tagName);
                        if (releaseWithTag) {
                            release = releaseWithTag;
                            console.log(`Found draft release with tag ${tagName} on the release list.`);
                            break;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                if (!release) {
                    throw new Error('release not found');
                }
            }
            else {
                const foundRelease = yield github.repos.getReleaseByTag({
                    owner,
                    repo,
                    tag: tagName
                });
                release = foundRelease.data;
                console.log(`Found release with tag ${tagName}.`);
            }
        }
        catch (error) {
            if (error.status === 404 || error.message === 'release not found') {
                console.log(`Couldn't find release with tag ${tagName}. Creating one.`);
                const createdRelease = yield github.repos.createRelease({
                    owner,
                    repo,
                    tag_name: tagName,
                    name: releaseName,
                    body: bodyFileContent || body,
                    draft,
                    prerelease,
                    target_commitish: commitish || github_1.context.sha
                });
                release = createdRelease.data;
            }
            else {
                console.log(`⚠️ Unexpected error fetching GitHub release for tag ${tagName}: ${error}`);
                throw error;
            }
        }
        if (!release) {
            throw new Error('Release not found or created.');
        }
        return {
            id: release.id,
            uploadUrl: release.upload_url,
            htmlUrl: release.html_url
        };
    });
}
exports.default = createRelease;
