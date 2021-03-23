# Analyze Toxicity with Perspective API

**Author**: Jigsaw (**[https://jigsaw.google.com](https://jigsaw.google.com)**)

**Description**: Analyze the perceived impact a comment might have on a conversation using [Perspective API](https://perspectiveapi.com).

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/conversationai/firestore-perspective-toxicity/issues/new/choose) in our GitHub repository.

---

**Details**: Use this extension to get toxicity scores from [Perspective
API](https://perspectiveapi.com) for comments
written to a Cloud Firestore collection.

This extension runs Perspective API on the text field and collection you
configure. The API uses machine learning models to score the perceived impact a
comment might have on a conversation by evaluating that comment across a range
of emotional concepts, called attributes. When you install this extension, you
will specify the attributes you want to receive scores for. Perspective's main
attribute is TOXICITY, defined as "a rude, disrespectful, or unreasonable
comment that is likely to make you leave a discussion". See a list of all
available attributes [on our website](https://support.perspectiveapi.com/s/about-the-api-attributes-and-languages).
Scores are retrieved when a new document is added to your collection or an
existing document is modified.

#### Additional setup

Before you can use this extension, you will need to enable Perspective API.
Follow [the instructions on our Get Started page](https://support.perspectiveapi.com/s/docs-get-started)
to request API access and then [enable the API and create an API
key](https://support.perspectiveapi.com/s/docs-enable-the-api).

By default, you're granted quota for 1 QPS to Perspective API. For additional
QPS, fill out a [quota increase
request](https://support.perspectiveapi.com/s/request-quota-increase) as needed.

**Note:** If you add or update documents at a rate higher than your allotted QPS,
you may exceed quota and the extension will fail to score your documents.

#### Billing

This extension uses other Firebase or Google Cloud services which may have associated charges:

- Cloud Firestore
- Cloud Functions

When you use Firebase Extensions, you're only charged for the underlying
resources that you use. A paid-tier billing plan is only required if the
extension uses a service that requires a paid-tier plan, for example calling to
a Google Cloud API or making outbound network requests to non-Google services.
All Firebase services offer a free tier of usage.
[Learn more about Firebase billing.](https://firebase.google.com/pricing)

Perspective API is free for all amounts of quota. Any costs associated with this
extension come from the Firebase and Google Cloud Platform services listed above.

**Configuration Parameters:**

- Cloud Functions location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

- Perspective API Key: What is the API key that will be used to call Perspective API?

- Attributes to receive scores for: The Perspective API predicts the perceived impact a comment may have on a conversation by evaluating that comment across a range of emotional concepts, called attributes. For help selecting which to receive scores for, see the [list of available attributes](https://support.perspectiveapi.com/s/about-the-api-attributes-and-languages).

- Collection path: What is the path to the collection that contains the comments you want to analyze?

- Input field name: What is the name of the field that contains the comment you want to analyze?

- Output field name: What is the name of the field where you want to store the output attribute scores?

- doNotStore flag value: Whether or not Perspective API is permitted to store the comment that gets sent in the request (the contents of the input field). Stored comments will be used to improve the API over time. NOTE\: This should be set to true if data being submitted is private (i.e. not publicly accessible) or contains content written by someone under 13 years old.

**Cloud Functions:**

- **fsAnalyzeCommentsOnCreate:** Listens for new comments in your specified Cloud Firestore collection, runs toxicity analysis, then writes the results back to the same document.

- **fsAnalyzeCommentsOnUpdate:** Listens for updates to comments in your specified Cloud Firestore collection, runs toxicity analysis, then writes the results back to the same document.

**Access Required**:

This extension will operate with the following project IAM roles:

- datastore.user (Reason: Allows the extension to write comment analysis results to Cloud Firestore.)
