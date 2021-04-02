"use strict";
/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fsAnalyzeCommentsOnUpdate = exports.fsAnalyzeCommentsOnCreate = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const perspectiveapi_js_client_1 = require("@conversationai/perspectiveapi-js-client");
const config_1 = require("./config");
const client = new perspectiveapi_js_client_1.Client(config_1.default.apiKey);
const logger = functions.logger;
// Initialize the Firebase Admin SDK
admin.initializeApp();
exports.fsAnalyzeCommentsOnCreate = functions.handler.firestore.document.onCreate(async (change) => {
    if (config_1.default.inputFieldName === config_1.default.outputFieldName) {
        logger.log("Input field name must not equal output field name.");
        return;
    }
    try {
        await handleCreateDocument(change);
    }
    catch (err) {
        logger.error(err);
    }
});
exports.fsAnalyzeCommentsOnUpdate = functions.handler.firestore.document.onUpdate(async (change) => {
    if (config_1.default.inputFieldName === config_1.default.outputFieldName) {
        logger.log("Input field name must not equal output field name.");
        return;
    }
    try {
        await handleUpdateDocument(change.before, change.after);
    }
    catch (err) {
        logger.error(err);
    }
});
const handleCreateDocument = async (snapshot) => {
    const input = extractInput(snapshot);
    if (!input) {
        return;
    }
    return updateDocumentOutputField(snapshot, await analyzeComment(input));
};
const handleUpdateDocument = async (beforeDocSnapshot, afterDocSnapshot) => {
    const inputBefore = extractInput(beforeDocSnapshot);
    const inputAfter = extractInput(afterDocSnapshot);
    if ((!inputAfter && !inputBefore) || inputBefore === inputAfter) {
        return;
    }
    if (inputAfter) {
        await updateDocumentOutputField(afterDocSnapshot, await analyzeComment(inputAfter));
    }
    else if (inputBefore) {
        // Input field was deleted. Delete the remaining output field.
        await updateDocumentOutputField(afterDocSnapshot, admin.firestore.FieldValue.delete());
    }
};
const extractInput = (snapshot) => {
    return snapshot.get(config_1.default.inputFieldName);
};
const analyzeComment = async (string) => {
    logger.log(`Analyzing field '${config_1.default.inputFieldName}' for ${config_1.default.attributes}`);
    try {
        return await client.getScores(string, {
            doNotStore: config_1.default.doNotStore === "true",
            attributes: config_1.default.attributes.split(","),
        });
    }
    catch (e) {
        // Something failed with the request. We raise a generic error message
        // because the perspectiveapi-js-client does not surface the API error text.
        return Promise.reject("Error with the Perspective API. Please ensure your configuration and " +
            "request are valid and you have sufficient quota.");
    }
};
const updateDocumentOutputField = async (snapshot, value) => {
    // Wrapping in transaction to allow for automatic retries (#48)
    await admin.firestore().runTransaction((transaction) => {
        transaction.update(snapshot.ref, config_1.default.outputFieldName, value);
        return Promise.resolve();
    });
};
//# sourceMappingURL=index.js.map