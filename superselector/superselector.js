(function() {
	superselector = function()
	{
		if (!document.getElementById("superselect"))
		{
			this.message = "Ctrl + click an element on the page to generate a selector";
			this.pConfigOptions = ["Ignore all config"];
			this.config = this.pConfigOptions;
			
			this.ignoreClasses = "hover, mouseOver";
			this.ignoreIdPrefixes = "generic_";
			
			this.prevElement = null;
			this.prevElementBorder = null;
			
			this.initialize(this);
		}
	};

	superselector.prototype.handleClick = function(oEvent)
	{
		if(oEvent.ctrlKey || oEvent.metaKey) 
		{
			/* Update current values */
			this.message = document.getElementById("superselect_generated").innerHTML;
			this.pConfigOptions = "";
			this.ignoreClasses = document.getElementById("ignoreClasses").value;
			this.ignoreIdPrefixes = document.getElementById("ignoreIdPrefixes").value;
			
			var genConfig = new superselector.Config(this.ignoreClasses, this.ignoreIdPrefixes, this.configOptionIsSelected("ignoreAllConfig"));
			var elementTarget = new superselector.Target(oEvent.target, genConfig);
			document.getElementById("superselect_generated").innerHTML = (elementTarget.calculateSelector());
			this.highlight(oEvent.target);
			this.setActive('superselect_generatortab', 'superselect_generator')
		}
	};

	superselector.prototype.highlight = function(target)
	{
		if (this.prevElement != null)
		{
			this.prevElement.style.outline = this.prevElementBorder;
		}
		this.prevElement = target;
		this.prevElementBorder = target.style.outline;
		target.style.outline = "2px black dotted";
	};

	superselector.prototype.configOptionIsSelected = function(sConfigId)
	{
		if(document.getElementById(sConfigId).checked == true) 
		{ 
			return true;
		}
		return false;
	};

	superselector.prototype.setActive = function(tabIdToSetActive, tabContentIdToDisplay)
	{
		var tabContainer = document.getElementById("superselect_tabs");
		var pTabs = tabContainer.getElementsByTagName("li");
		this.setArrayElementClasses(pTabs, "");
		document.getElementById(tabIdToSetActive).setAttribute("class", "superselect_activetab");

		var pageContainer = document.getElementById("superselect_tabcontent");
		var pPages = pageContainer.children;
		this.setArrayElementClasses(pPages, "superselect_hidden");
		document.getElementById(tabContentIdToDisplay).setAttribute("class", "");
	};

	superselector.prototype.setArrayElementClasses = function(pArray, sClass)
	{
		for (var i = 0; i < pArray.length; i++)
		{
			pArray[i].setAttribute("class", sClass);
		}
	};

	superselector.prototype.slide = function(hide)
	{
		var display = document.getElementById("superselect");
		if(hide)
		{
			display.setAttribute("class", "superselect superselect_hidden");
		}
		else	
		{
			display.setAttribute("class", "superselect superselect_dockright");
		}
		
		
	};
	/* END OF MODEL */


	/* CONFIG */
	superselector.Config = function(ignoreClasses, ignoreIdPrefixes, disableConfig)
	{
		this.disableConfig = disableConfig;
		this.ignoreClasses = ignoreClasses.replace(/\s+/g, '').split(/\s*,\s*/);
		this.ignoreIdPrefixes = ignoreIdPrefixes.replace(/\s+/g, '').split(/\s*,\s*/);
	};
	/* END OF CONFIG */


	/* TARGET */
	superselector.Target = function(eElement, oConfig)
	{
		this.targetElement = eElement;
		this.currentElement = eElement;
		this.completed = false;
		this.selectors = [];
		this.disableConfig = oConfig.disableConfig;
		this.ignoreIdPrefixes = oConfig.ignoreIdPrefixes;
		this.ignoreClasses = oConfig.ignoreClasses;
	};

	superselector.Target.prototype.calculateSelector = function()
	{
		var prefix = '$$("';
		var suffix = '");';
		
		this.traverseAndCalc(this.targetElement);
		
		return prefix + this.generateSelectorString() + suffix;
	};

	superselector.Target.prototype.generateSelectorString = function()
	{
		var selectorString = "";
		for (var i = this.selectors.length-1; i >= 0 ; i--)
		{
			selectorString += this.selectors[i];
			if (i != 0) { selectorString += " "; }
		}
		
		return selectorString;
	};

	superselector.Target.prototype.traverseAndCalc = function(eElement)
	{
		var sId = eElement.getAttribute("id");
		var sClass = eElement.getAttribute("class");
		
		while (this.completed == false && this.currentElement != null)
		{
			sId = this.currentElement.getAttribute("id");
			sClass = this.currentElement.getAttribute("class");
			
			if(sId != null && this.isAllowedId(sId))			/* ID CODE PATH */
			{
				this.calculateIdSelector(sId);
			}
			else if (sClass != null && sClass != "")			/* CLASS CODE PATH */
			{
				this.calculateClassSelector(sClass);
			}
			else 
			{
				this.calculateTagSelector(); 					/* TAGNAME CODE PATH */
			}

			this.currentElement = this.currentElement.parentElement;
		}
		
		this._appendEqSuffixIfNeeded();

		return this.selectors;
	};

	superselector.Target.prototype.calculateIdSelector = function (sElementId)
	{
		if(document.getElementById(sElementId) != null)
		{
			this.selectors.push("#" + sElementId);
			this.completed = true;
		}
	};

	superselector.Target.prototype.calculateClassSelector = function(sClass)
	{
		var selectorForClass = this._generateSelectorClassesString(sClass);	/* remove dupe */
		if(selectorForClass != "")
		{
			this.selectors.push("." + selectorForClass);
			
			var foundElementsInDom = document.getElementsByClassName(selectorForClass);
			if (foundElementsInDom.length == 1) 
			{
				this.completed = true;
			}
		}
		else 
		{
			this.calculateTagSelector(); 
		}
	};

	superselector.Target.prototype.calculateTagSelector = function()
	{
		var sTagName = this.currentElement.tagName;
		var eParent = this.currentElement.parentElement;
		var pChildElementsToConsider = (eParent == null ? [] : eParent.children);
		var pTagElementsToConsider = (eParent == null ? [] : eParent.getElementsByTagName(sTagName));
		
		if(sTagName.toLowerCase() == "body")
		{
			this.selectors.push(sTagName.toLowerCase());
		}

		else if(pTagElementsToConsider.length == 1)
		{
			this.selectors.push(sTagName.toLowerCase());
		}

		else
		{
			for (var i = 0; i < pChildElementsToConsider.length; i++)
			{
				if (pChildElementsToConsider[i] == this.currentElement)
				{
					this.selectors.push(sTagName.toLowerCase() + ":nth-child(" + (i+1) + ")");
				}
			}
		}
	};

	superselector.Target.prototype.isAllowedId = function(sIdName)
	{
		if (this.disableConfig)
		{
			return true;
		}
		for (var i = 0; i < this.ignoreIdPrefixes.length; i++)
		{
			if (sIdName.toLowerCase().indexOf(this.ignoreIdPrefixes[i].toLowerCase()) == 0 &&
				this.ignoreIdPrefixes[i] != "")
			{
				return false;
			}
		}
		return true;
	};

	superselector.Target.prototype.isAllowedClass = function(sName)
	{
		if (this.disableConfig)
		{
			return true;
		}
		for (var i = 0; i < this.ignoreClasses.length; i++)
		{
			if (this.ignoreClasses[i].toLowerCase() == sName.toLowerCase())
			{
				return false;
			}
		}
		return true;
	};

	/*
	 * Private
	 */

	superselector.Target.prototype._appendEqSuffixIfNeeded = function()
	{
		

	};

	superselector.Target.prototype._generateSelectorClassesString = function(sClassName)
	{
		var pValidClasses = this._returnValidClasses(sClassName);
		var eParent =  this.currentElement.parentElement;
		
		/* See if we can get a class selector within the current element's parent which is unique */
		for (var i = 0; i < pValidClasses.length; i++)
		{
			if (eParent.getElementsByClassName(pValidClasses[i]).length == 1 &&
				eParent.getElementsByClassName(pValidClasses[i])[0] == this.currentElement)
			{
				return pValidClasses[i];
			}
		}
		
		/* See if we can get a class + eq(X) selector inside the current element's parent */
		var className = pValidClasses[0];
		var foundElements = eParent.getElementsByClassName(className);
		for (var i = 0; i < foundElements.length; i ++)
		{
			if (foundElements[i] == this.currentElement)
			{
				return className + ":nth-child(" + (i+1) + ")";
			}
		}
		
		return pValidClasses.join(", ");
	};

	/* Filter classes against the ignore classes list */
	superselector.Target.prototype._returnValidClasses = function(className)
	{
		var classes = className.split(" ");
		var pClassesToReturn = [];
		
		for (var i = 0; i < classes.length; i++)
		{
			if(this.isAllowedClass(classes[i]))
			{
				if(this._classDoesNotAlreadyExistInArray(classes[i], pClassesToReturn))
				{
					pClassesToReturn.push(classes[i]);
				}
			}
		}
		return pClassesToReturn;
	};

	/* Assert that sClass does not exist in pClassArray */
	superselector.Target.prototype._classDoesNotAlreadyExistInArray = function(sClass, pClassArray)
	{
		for (var x = 0; x < pClassArray.length; x++)
		{
			if(sClass.toLowerCase() == pClassArray[x].toLowerCase())
			{
				return false;
			}
		}
		return true;
	};
	/* END OF TARGET */

	/* INITIALIZE */
	superselector.prototype.initialize = function(oSS)
	{
		var css = document.createElement('link');
		// css.href = "http://caplin.github.com/SuperSelector/superselector/style.css";
		css.href = "data:text/css;base64,LnN1cGVyc2VsZWN0IHsNCglkaXJlY3Rpb246IGx0cjsNCgloZWlnaHQ6MTIwcHg7DQoJd2lkdGg6NjAwcHg7DQoJei1pbmRleDo5OTk5OTsNCgliYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDAsMCwwLDAuNzUpOw0KCXBvc2l0aW9uOmFic29sdXRlOw0KCWJvcmRlci1yYWRpdXM6M3B4Ow0KCWJvcmRlcjpibGFjayAxcHggc29saWQ7DQoJb3BhY2l0eTogMTsNCglmb250LWZhbWlseTogQXJpZWw7DQoJZm9udC1zaXplOiAxNnB4Ow0KfQ0KDQojc3VwZXJzZWxlY3RfdGFicyB7DQoJaGVpZ2h0OjI0cHg7DQoJcGFkZGluZy1sZWZ0OiAzcHg7DQoJbWFyZ2luLXRvcDogLTEycHg7DQp9DQoNCiNzdXBlcnNlbGVjdF90YWJzID4gdWx7DQoJZm9udDogMC45ZW07DQoJbGlzdC1zdHlsZTpub25lOw0KCS13ZWJraXQtcGFkZGluZy1zdGFydDogMHB4Ow0KfQ0KDQojc3VwZXJzZWxlY3RfdGFicyA+IHVsID4gbGl7DQoJbWFyZ2luOjAgMnB4IDAgMDsNCglwYWRkaW5nOjJweCAxMHB4Ow0KCWRpc3BsYXk6YmxvY2s7DQoJZmxvYXQ6bGVmdDsNCgljb2xvcjojRkZGOw0KCS13ZWJraXQtdXNlci1zZWxlY3Q6IG5vbmU7DQoJLW1vei11c2VyLXNlbGVjdDogbm9uZTsNCgl1c2VyLXNlbGVjdDogbm9uZTsNCgktbW96LWJvcmRlci1yYWRpdXMtdG9wbGVmdDogNHB4Ow0KCS1tb3otYm9yZGVyLXJhZGl1cy10b3ByaWdodDogNHB4Ow0KCS1tb3otYm9yZGVyLXJhZGl1cy1ib3R0b21yaWdodDogMHB4Ow0KCS1tb3otYm9yZGVyLXJhZGl1cy1ib3R0b21sZWZ0OiAwcHg7DQoJYm9yZGVyLXRvcC1sZWZ0LXJhZGl1czo0cHg7DQoJYm9yZGVyLXRvcC1yaWdodC1yYWRpdXM6IDRweDsNCglib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1czogMHB4Ow0KCWJvcmRlci1ib3R0b20tbGVmdC1yYWRpdXM6IDBweDsgDQoJYmFja2dyb3VuZDogI0M5QzlDOTsgLyogb2xkIGJyb3dzZXJzICovDQoJYmFja2dyb3VuZDogLW1vei1saW5lYXItZ3JhZGllbnQodG9wLCAjMEM5MUVDIDAlLCAjMjU3QUI2IDEwMCUpOyAvKiBmaXJlZm94ICovDQoJYmFja2dyb3VuZDogLXdlYmtpdC1ncmFkaWVudChsaW5lYXIsIGxlZnQgdG9wLCBsZWZ0IGJvdHRvbSwgY29sb3Itc3RvcCgwJSwjMEM5MUVDKSwgY29sb3Itc3RvcCgxMDAlLCMyNTdBQjYpKTsgLyogd2Via2l0ICovDQp9DQoNCiNzdXBlcnNlbGVjdF90YWJzID4gdWwgPiBsaTpob3ZlcnsNCgliYWNrZ3JvdW5kOiAjRkZGRkZGOyAvKiBvbGQgYnJvd3NlcnMgKi8NCgliYWNrZ3JvdW5kOiAtbW96LWxpbmVhci1ncmFkaWVudCh0b3AsICNGRkZGRkYgMCUsICNGM0YzRjMgMTAlLCAjRjNGM0YzIDUwJSwgI0ZGRkZGRiAxMDAlKTsgLyogZmlyZWZveCAqLw0KCWJhY2tncm91bmQ6IC13ZWJraXQtZ3JhZGllbnQobGluZWFyLCBsZWZ0IHRvcCwgbGVmdCBib3R0b20sIGNvbG9yLXN0b3AoMCUsI0ZGRkZGRiksIGNvbG9yLXN0b3AoMTAlLCNGM0YzRjMpLCBjb2xvci1zdG9wKDUwJSwjRjNGM0YzKSwgY29sb3Itc3RvcCgxMDAlLCNGRkZGRkYpKTsgLyogd2Via2l0ICovDQoJY3Vyc29yOnBvaW50ZXI7DQoJY29sb3I6ICMzMzM7DQp9DQoNCiNzdXBlcnNlbGVjdF90YWJzID4gdWwgPiBsaS5zdXBlcnNlbGVjdF9hY3RpdmV0YWJ7DQoJYmFja2dyb3VuZDogI0ZGRkZGRjsgLyogb2xkIGJyb3dzZXJzICovDQoJYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLDAsMCwwLjc1KTsNCgljdXJzb3I6cG9pbnRlcjsNCgljb2xvcjogd2hpdGU7DQp9DQoNCi5zdXBlcnNlbGVjdF9oaWRkZW4gew0KCWRpc3BsYXk6bm9uZTsNCn0NCg0KI3N1cGVyc2VsZWN0X2dlbmVyYXRlZCB7DQoJY29sb3I6d2hpdGU7DQoJYmFja2dyb3VuZC1jb2xvcjpibGFjazsNCglmb250LWZhbWlseTpDb3VyaWVyOw0KCWZvbnQtc2l6ZTowLjhlbTsNCgltYXJnaW4tbGVmdDozcHg7DQoJbWFyZ2luLXJpZ2h0OjNweDsNCgloZWlnaHQ6NjBweDsNCglwYWRkaW5nLWxlZnQ6IDVweDsNCglwYWRkaW5nLXRvcDogNXB4OyANCglwYWRkaW5nLWxlZnQ6NXB4Ow0KCXBhZGRpbmctYm90dG9tOjVweDsNCglib3JkZXItdG9wLXJpZ2h0LXJhZGl1czozcHg7DQp9DQoNCi5zdXBlcnNlbGVjdF9nZW5vcHRpb25zIHsNCgljb2xvcjp3aGl0ZTsNCgliYWNrZ3JvdW5kLWNvbG9yOiMyNTdBQjY7DQoJZm9udC1mYW1pbHk6Q291cmllcjsNCglmb250LXNpemU6MC44ZW07DQoJbWFyZ2luLWxlZnQ6M3B4Ow0KCW1hcmdpbi1yaWdodDozcHg7DQoJaGVpZ2h0OjE4cHg7DQoJcGFkZGluZy1sZWZ0OiA1cHg7DQoJcGFkZGluZy1sZWZ0OjVweDsNCglib3JkZXI6IDFweCBibGFjayBzb2xpZDsNCglib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzOjNweDsNCglib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1czozcHg7DQoJbGluZS1oZWlnaHQ6IDE2cHg7DQp9DQoNCi5zdXBlcnNlbGVjdF9nZW5vcHRpb25zIGlucHV0IHsNCgl2ZXJ0aWNhbC1hbGlnbjptaWRkbGU7DQp9DQoNCi5zdXBlcnNlbGVjdF9nZW5vcHRpb25zIHNwYW4gew0KCXZlcnRpY2FsLWFsaWduOm1pZGRsZTsNCn0NCg0KLmNvbmZpZ19hcmVhIHsNCgl3aWR0aDo1NzhweDsNCglyZXNpemU6Ym90aDsNCgloZWlnaHQ6NTJweDsNCgltYXJnaW4tdG9wOiA1cHg7DQp9DQoNCiNzdXBlcnNlbGVjdF9jb25maWcxIHsNCgljb2xvcjp3aGl0ZTsNCgliYWNrZ3JvdW5kLWNvbG9yOmJsYWNrOw0KCWZvbnQtZmFtaWx5OkNvdXJpZXI7DQoJZm9udC1zaXplOjAuOGVtOw0KCW1hcmdpbi1sZWZ0OjNweDsNCgltYXJnaW4tcmlnaHQ6M3B4Ow0KCWhlaWdodDo4MHB4Ow0KCXBhZGRpbmctbGVmdDogNXB4Ow0KCXBhZGRpbmctdG9wOiA1cHg7IA0KCXBhZGRpbmctbGVmdDo1cHg7DQoJcGFkZGluZy1ib3R0b206NXB4Ow0KCWJvcmRlci10b3AtcmlnaHQtcmFkaXVzOjNweDsNCglib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzOjNweDsNCglib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1czozcHg7DQp9DQoNCiNzdXBlcnNlbGVjdF9jb25maWcyIHsNCgljb2xvcjp3aGl0ZTsNCgliYWNrZ3JvdW5kLWNvbG9yOmJsYWNrOw0KCWZvbnQtZmFtaWx5OkNvdXJpZXI7DQoJZm9udC1zaXplOjAuOGVtOw0KCW1hcmdpbi1sZWZ0OjNweDsNCgltYXJnaW4tcmlnaHQ6M3B4Ow0KCWhlaWdodDo4MHB4Ow0KCXBhZGRpbmctbGVmdDogNXB4Ow0KCXBhZGRpbmctdG9wOiA1cHg7IA0KCXBhZGRpbmctbGVmdDo1cHg7DQoJcGFkZGluZy1ib3R0b206NXB4Ow0KCWJvcmRlci10b3AtcmlnaHQtcmFkaXVzOjNweDsNCglib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzOjNweDsNCglib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1czozcHg7DQp9DQoNCi5zdXBlcnNlbGVjdF9kb2NrcmlnaHQgew0KCXJpZ2h0OjVweDsNCglib3R0b206NXB4Ow0KCXBvc2l0aW9uOmZpeGVkOw0KfQ0KDQouc3VwZXJzZWxlY3RfZG9ja2xlZnQgew0KCWxlZnQ6NXB4Ow0KCWJvdHRvbTo1cHg7DQoJcG9zaXRpb246Zml4ZWQ7DQp9DQoNCi5zdXBlcnNlbGVjdF9sZWZ0aWNvbiB7DQoJY29sb3I6Z3JleTsNCgl3aWR0aDoxNnB4Ow0KCWhlaWdodDoxNnB4Ow0KCWJhY2tncm91bmQtaW1hZ2U6dXJsKCdpbWcvZG9ja19sZWZ0LnBuZycpOw0KCWJhY2tncm91bmQtcmVwZWF0OiBuby1yZXBlYXQ7DQoJcG9zaXRpb246IGFic29sdXRlOw0KCW1hcmdpbi1yaWdodDo1ODRweDsNCn0NCg0KLnN1cGVyc2VsZWN0X3JpZ2h0aWNvbiB7DQoJY29sb3I6Z3JleTsNCgl3aWR0aDoxNnB4Ow0KCWhlaWdodDoxNnB4Ow0KCWJhY2tncm91bmQtaW1hZ2U6dXJsKCdpbWcvZG9ja19yaWdodC5wbmcnKTsNCgliYWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0Ow0KCXBvc2l0aW9uOmFic29sdXRlOw0KCW1hcmdpbi1sZWZ0OjU4NHB4Ow0KfQ0K";
		css.type = 'text/css';
		css.rel  = 'stylesheet';
		var head = document.getElementsByTagName('head')[0];
		head.appendChild(css);

		var superselectorHtml = 
			"<div id='superselect' class='superselect superselect_dockright'>" +
			"<div id='superselect_tabs'>" +
			"<ul>" +
				"<li id='superselect_generatortab' class='superselect_activetab' onclick=\"superselector.prototype.setActive('superselect_generatortab', 'superselect_generator')\">Generator</li>" +
				"<li id='superselect_configtab1' onclick=\"superselector.prototype.setActive('superselect_configtab1', 'superselect_config1')\">Config Classes</li>" +
				"<li id='superselect_configtab2' onclick=\"superselector.prototype.setActive('superselect_configtab2', 'superselect_config2')\">Config Ids</li>" +
			"</ul>" +
			"</div>" +
			"<div id='superselect_tabcontent'>" +
				"<div id='superselect_generator'>" +
					"<div id='superselect_generated'></div>" +
					"<div class='superselect_genoptions'>" +
						"<input id='ignoreAllConfig' type='checkbox' value='Ignore all config' name=''>" +
						"<span>Ignore all config</span>" +
					"</div>" +
				"</div>" +
				"<div id='superselect_config1' class='superselect_hidden'>" +
					"<div>Comma-delimiter list of classes to ignore  (E.g 'hover, mouseOver')</div>" +
					"<textarea id='ignoreClasses' class='config_area' name='ignoreClasses'></textarea>" +
				"</div>" +
				"<div id='superselect_config2' class='superselect_hidden'>" +
					"<div>Comma-delimiter list of ID prefixes to ignore (E.g 'generated, generic_')</div>" +
					"<textarea id='ignoreIdPrefixes' class='config_area' name='ignoreIdPrefixes'></textarea>" +
				"</div>" +
			"</div>";
		
		var eElement = document.createElement("div");
		eElement.innerHTML = superselectorHtml;
		document.body.appendChild(eElement);

		document.getElementById("superselect_generated").innerHTML = oSS.message;
		document.getElementById("ignoreClasses").value = oSS.ignoreClasses;
		document.getElementById("ignoreIdPrefixes").value = oSS.ignoreIdPrefixes;
		
		document.body.addEventListener("click", oSS.handleClick.bind(oSS), false);
	};
	
	new superselector();
	
	return undefined;
})();

