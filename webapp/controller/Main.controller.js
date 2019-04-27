/*eslint-disable no-console, no-alert*/

/*global history*/

sap.ui.define([

	"sap/ui/core/mvc/Controller",

	"sap/m/MessageBox",

	"sap/ui/model/json/JSONModel",

	'sap/m/Button',

	'sap/m/Dialog',

	'sap/m/List',

	'sap/m/StandardListItem'

], function (Controller, MessageBox, JSONModel, Button, Dialog, List, StandardListItem) {

	"use strict";

	return Controller.extend("com.flexso.HackTheFuture.controller.Main", {

		onInit: function () {

			this.getIotData();

		},

		getIotData: function () {
			var res = new JSONModel;
			$.ajax({
				type: 'GET',
				url: '/devices/106/measures',
				async: false
			}).success(function (results) {
				console.log(results);
				console.log(results[0]);
				res = results;
			})
			.fail(function (err) {
				if (err !== undefined) {
					var oErrorResponse = $.parseJSON(err.responseText);
					sap.m.MessageToast.show(oErrorResponse.message, {
						duration: 6000
					});
				} else {
					sap.m.MessageToast.show("Unknown error!");
				}
			});
			var group = this.groupData(res);
			var oModel = new JSONModel({
				"signs": group
			});
			this.getView().setModel(oModel, "signModel");
			console.log(group);
			// url to get the artifact signals of your device :
			// '/devices/XX/measures'  -> XX = your device id
		},
		groupData: function (data) {
			var current = 0;
			var aResult = [];
			var aFianl = [];
			data.forEach(function (element) {
				if (element.measure.artifact_id) {
					aResult.push(element.measure.artifact_id);
				}
				if (element.measure.longitude) {
					aResult.push(element.measure.longitude);
				}
				if (element.measure.latitude) {
					aResult.push(element.measure.latitude);
				}
				if (element.measure.artifact_signal) {
					aResult.push(element.measure.artifact_signal);
				}
			});
			var i = 0;
			for (i; i <= aResult.length; i++) {
				if (i != 0) {
					if (i % 4 == 0) {
						var signal = {
							"artifact_id": aResult[i - 4],
							"longitude": aResult[i - 3],
							"latitude": aResult[i - 2],
							"artifact_signal": aResult[i - 1]
						};
						aFianl.push(signal);
						i = i;
					}
				}
			}
			return aFianl;
		},
		triggerML: function (oEvent) {
			var me = this;
			var base64 = oEvent.getSource().getCustomData()[0].getProperty('value');
			this.getMlAuthToken().then(function (token) {
				me.sendToMl(token, base64);
			});
		},
		getMlAuthToken: function () {
			var promise = new Promise(function (resolve, reject) {
				$.ajax({
					type: "GET",
					url: "/token?grant_type=client_credentials",
					headers: "",
					success: function (data) {
						resolve(data);
					},
					error: function (Error) {
						reject((Error));
					},
					contentType: false,
					async: true,
					data: null,
					cache: false,
					processData: false
				});
			});
			return Promise.resolve(promise).then(function (result) {
				return "Bearer " + result.access_token;
			});
		},
		/*sendToMl: function (base64, token) {

				// console.log(base64);

				// console.log(token);

				//Use the following format to send to ML (image name can always be 'ArtifactSignal.jpg')

				//image is a variable

				var image = this.base64toBlob(base64);

				var formData = new FormData();

				formData.append("files", image, "ArtifactSignal.jpg");

				//ajax call met token , data: formdata

				$.ajax({

					type: 'POST',

					url: '/ml-dest/api/v2/image/classification/models/HTF/versions/2',

					headers: {
						"Authorization": token
					},

					data: formData,

					async: false

				}).success(function(data) {

					console.log(data);

				})

				.fail(function (err) {

				if (err !== undefined) {

					var oErrorResponse = $.parseJSON(err.responseText);

					sap.m.MessageToast.show(oErrorResponse.message, {

						duration: 6000

					});

				} else {

					sap.m.MessageToast.show("Unknown error!");

				}

			});

			//url to post on : '/ml-dest/api/v2/image/classification/models/HTF/versions/2'

		},*/

		sendToMl: function (token, base64) {
			var contentType = 'image/jpg';
			var image = this.base64toBlob(base64, contentType);
			var blobUrl = URL.createObjectURL(image);
			var formData = new FormData();
			formData.append("files", image, "ArtifactSignal.jpg");
			var promise = new Promise(function (resolve, reject) {
				$.ajax({
					type: "POST",
					url: "/ml-dest/api/v2/image/classification/models/HTF/versions/2",
					headers: {
						"Accept": "application/json",
						"APIKey": token,
						"Authorization": token
					},
					success: function (data) {
						console.log(data);
						resolve(data);
					},
					error: function (Error) {
						reject((Error));
					},
					contentType: false,
					async: false,
					data: formData,
					cache: false,
					processData: false
				});
			});
			return Promise.resolve(promise).then(function (result) {
				var obj = {
					"result": result,
					"image": blobUrl
				};
				return obj;
			});
		},

		base64toBlob: function (b64Data, contentType, sliceSize) {

			sliceSize = sliceSize || 512;

			var byteCharacters = atob(b64Data);

			var byteArrays = [];

			for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {

				var slice = byteCharacters.slice(offset, offset + sliceSize);

				var byteNumbers = new Array(slice.length);

				for (var i = 0; i < slice.length; i++) {

					byteNumbers[i] = slice.charCodeAt(i);

				}

				var byteArray = new Uint8Array(byteNumbers);

				byteArrays.push(byteArray);

			}

			var blob = new Blob(byteArrays, {

				type: contentType

			});

			return blob;

		}

	});

});