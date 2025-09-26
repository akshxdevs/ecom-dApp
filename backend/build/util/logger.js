"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var morgan_1 = __importDefault(require("morgan"));
var rotating_file_stream_1 = __importDefault(require("rotating-file-stream"));
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
// log directory path
var logDirectory = path_1.default.resolve(__dirname, '../../log');
// ensure log directory exists
fs_1.default.existsSync(logDirectory) || fs_1.default.mkdirSync(logDirectory);
// create a rotating write stream
var accessLogStream = rotating_file_stream_1.default('access.log', {
    interval: '1d',
    path: logDirectory
});
exports.default = {
    dev: morgan_1.default('dev'),
    combined: morgan_1.default('combined', { stream: accessLogStream })
};
