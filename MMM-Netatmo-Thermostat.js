/* global Module */

/* Magic Mirror
 * Module: MMM-Netatmo-Thermostat
 *
 * By 
 * MIT Licensed.
 */

Module.register("MMM-Netatmo-Thermostat", {
	defaults: {
		refreshToken: null,
		clientId: null,
		clientSecret: null,
		updateInterval: 60000,
		api: {
      			base: 'https://api.netatmo.com/',
      			authEndpoint: 'oauth2/token',
      			authPayload: 'grant_type=refresh_token&refresh_token={0}&client_id={1}&client_secret={2}',
      			dataEndpoint: 'api/getthermostatsdata',
      			dataPayload: 'access_token={0}'
    		}
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
		var self = this;

		//Flag for check if module is loaded
		this.loaded = false;

		// Get initial data from netatmo connect api.
		this.getData();
	},

	load: {
    		token: function() {
			return Q($.ajax({
				type: 'POST',
        			url: this.config.api.base + this.config.api.authEndpoint,
        			data: this.config.api.authPayload.format(
					this.config.refreshToken,
					this.config.clientId,
					this.config.clientSecret
				)
      			}));
    		},
    
		data: function(data) {
      			this.config.refreshToken = data.refresh_token;
      			// call for station data
      			return Q($.ajax({
        			url: this.config.api.base + this.config.api.dataEndpoint,
        			data: this.config.api.dataPayload.format(data.access_token)
      			}));
		}
	},

	renderAll: function(data) {
		this.processData(data.body.devices[0]);
    		// render modules
    		return Q({});
  	},
  
	renderError: function(reason) {
    		/* eslint-disable no-console */
    		console.log("error " + reason);
  	},

	/*
	 * getData
	 * function example return data and show it in the module wrapper
	 * get a URL request
	 *
	 */
	getData: function() {
		var self = this;
		return Q.fcall(
      			this.load.token.bind(self),
			this.renderError.bind(self)
		).then(
      			this.load.data.bind(self),
			this.renderError.bind(self)
    		).done(
      			this.renderAll.bind(self)
    		);
	},


	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update.
	 *  If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad ;
		var self = this;
		setTimeout(function() {
			self.getData();
		}, nextLoad);
	},

	formatTemp: function (t) {
    		var tTxt = String(t);
    		if (tTxt.indexOf(".") != -1) {
      			var tempParts = tTxt.split(".");
      			return tempParts[0] + "<sup class='tempDecimal'>" + tempParts[1] + "</sup>";
    		} else {
      			return tTxt;
		}
	},

	getDom: function() {
		var self = this;

		// create element wrapper for show into the module
		var wrapper = document.createElement("div");

		// Data from helper
		if (this.data.modules) {
			console.log(this.data);
			var theName = document.createElement("div");
                        wrapper.id = "circle";
                        wrapper.innerHTML = this.formatTemp(this.data.modules[0].measured.temperature);
			if (this.data.modules[0].setpoint.setpoint_mode === "off") {
                                wrapper.className = "off";
                        } else {
				if (this.data.modules[0].therm_relay_cmd !== 0 || this.data.modules[0].anticipating === true) {
	                        	wrapper.className = "heating";
	                        } else {
	                                wrapper.className = "cooling";
	                        }
                        }
                        wrapper.appendChild(theName);
		}
		return wrapper;
	},

	getScripts: function() {
		return [
			'q.min.js',
			'String.format.js'
		];
	},

	getStyles: function () {
		return [
			"MMM-Netatmo-Thermostat.css",
		];
	},

	// Load translations files
	getTranslations: function() {
		//FIXME: This can be load a one file javascript definition
		return {
			en: "translations/en.json",
			es: "translations/es.json"
		};
	},

	processData: function(data) {
		var self = this;
		this.data = data;
		self.updateDom(self.config.animationSpeed);
		this.loaded = true;
		this.scheduleUpdate(self.config.updateInterval);
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
	},
});
