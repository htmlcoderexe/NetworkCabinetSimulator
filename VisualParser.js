function VisualParser(code, fx, root)
{
	this.origCode = code;
	this.parseTable = fx;
	this.rootObject = root;
	this.lines = code.split(/\r?\n/);
	this.warncodes = {
		0: "Unspecified warning",
		1: "Unexpected %last_token%",
		2: "Uknown identifier %last_token%",
		3: "Duplicate name \"%last_name%\"",
	};
	this.WARN_UNEXPECTED_TOKEN = 1;
	this.WARN_UNKNOWN_TOKEN = 2;
	this.WARN_NAME_COLLISION = 3;
	this.WARN_MISSING_PARAM = 4;
	this.errorcodes = {
		0: "Unspecified error",
		1: "No root object found",
		2: "Name '%last_name%' already exists in current %parent_type%."
	};
	this.ERR_NO_ROOT = 1;
	this.ERR_NAME_COLLISION = 2;
	for(var linenumber = 0;linenumber < this.lines.length; linenumber++)
	{
		this.lines[linenumber] = this.lines[linenumber].trim();
	}
	this.init = function()
	{		
		this.index = 0;
		this.offset = 0;
		this.oldOffset = 0;
		this.currentLine = "";
		this.objectStack = [];
		this.errors = [];
		this.warnings = [];
		this.statevars = {};
	};
	this.warn = function(code = 0)
	{
		let effectiveCode = code;
		if(!this.warncodes[code])
			effectiveCode = 0;
		let msg = this.warncodes[effectiveCode];
		let msg2 = msg;
		for(let statevar in this.statevars)
		{
			msg2 = msg2.replaceAll("%"+statevar+"%",this.statevars[statevar]);
		}
		console.log("Parser warning on line "+ this.index+": #" + code + ": " + msg2);
		this.warnings.push({code: code, message: msg2, line: this.index, character: this.oldOffset});
	};
	this.error = function(code = 0)
	{
		let effectiveCode = code;
		if(!this.errorcodes[code])
			effectiveCode = 0;
		let msg = this.errorcodes[effectiveCode];
		let msg2 = msg;
		for(let statevar in this.statevars)
		{
			console.log(statevar);
			msg2 = msg2.replaceAll("%"+statevar+"%",this.statevars[statevar]);
		}
		console.log("Syntax error on line "+ this.index+": #" + code + ": " + msg2);
		this.errors.push({code: code, message: msg2, line: this.index, character: this.oldOffset});
	};
	this.saveOffset = function()
	{
		this.oldOffset = this.offset;
	};
	this.backtrack = function()
	{
		this.offset = this.oldOffset;
	};
	this.getWord = function ()
	{
		let nextspace = this.currentLine.indexOf(" ", this.offset);
		let word = "";
		if(this.offset >= this.currentLine.length)
		{
			return "";
		}
		if(nextspace === -1)
		{
			word = this.currentLine.slice(this.offset);
			this.offset = this.currentLine.length;
			this.statevars['last_name'] = word;
			return word;
		}
		else
		{
			word = this.currentLine.slice(this.offset, nextspace);
			this.offset = nextspace+1;
			this.statevars['last_name'] = word;
			return word;
		}
	}
	this.getInt = function (suppressNaN = false)
	{
		const word = this.getWord();
		const value = parseInt(word);
		if(isNaN(value) && suppressNaN)
		{
			return 0;
		}
		return value;
	};
	this.getRest = function()
	{
		let word = this.currentLine.slice(this.offset);
		this.offset = this.currentLine.length;
		this.statevars['last_name'] = word;
		return word;
	}
	/// gets whatever the topmost object currently is
	this.getCurrent = function()
	{
		return this.objectStack.length >0 && this.objectStack[0];
	};
	/// 
	this.doLine = function()
	{
		this.currentLine = this.lines[this.index];
		this.offset = 0;
		this.oldOffset = 0;
		const word = this.getWord();
		this.statevars['last_token'] = word;
		const op = word.toUpperCase();
		const current = this.getCurrent();
		if(op in this.parseTable)
		{
			this.oldOffset = this.offset;
			return this.parseTable[op].call(this,current);
		}
		else
		{
			this.warn(this.WARN_UNKNOWN_TOKEN);
			return true;
		}
	};
	this.go = function()
	{
		while(this.index<this.lines.length && this.doLine())
		{
			this.index++;
		}
		this.commit("");
	};
	this.checkParent = function(type)
	{
		for(let i =0;i<this.objectStack.length;i++)
		{
			if(this.objectStack[i].type == type)
			{
				return true;
			}
		}
		return false;
	}
	this.commit = function(type)
	{
		this.statevars['parent_type'] = type;
		while(this.objectStack.length > 0 && this.objectStack[0].type != type)
		{
			let cur = this.objectStack[0];
			console.log("trying to commit a <", cur.type, ">...")
			if(cur.commit(this))
			{
				console.log("yes");
				let added = cur.parent.addItem(cur);
				if(!added)
				{
					this.warn(this.WARN_NAME_COLLISION);
				}
			}
			this.objectStack.shift();
		}
		return this.objectStack.length > 0 ? this.objectStack[0] : null;
	};
};