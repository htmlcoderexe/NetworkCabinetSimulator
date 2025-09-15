
invparser = {
	"CONNECTOR": function(current)
	{
		//console.log(this.objectStack);
		this.commit("");
		let name = this.getRest();
		if(this.rootObject.checkName(name))
		{
			this.err(this.ERR_NAME_COLLISION);
			return false;
		}
		let newconn = new VisualConnectorTemplate(this.rootObject, name);
		this.objectStack.unshift(newconn);
		return true;
	},
	"LABEL": function(current)
	{
		if(!current)
		{
			this.warn(WARN_LOOSE_LABEL);
			return true;
		}
		let text = this.getRest();
		if(!text)
		{
			this.warn(WARN_EMPTY_LABEL);
		}
		current.label = text;
		return true;
	},
	"DIM": function(current)
	{
		if(!current || current.type != "socket_tpl")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let A = this.getInt();
		let B = this.getWord();
		current.width = A;
        current.height = B; // #TODO: keywords
		return true;
	},
	"RENDER": function(current)
	{
		//console.log(this.objectStack);
		if(!this.checkParent("socket_tpl"))
		{
			this.warn(WARN_LOOSE_RACK);
			return true;
		}
		let parent = this.commit("socket_tpl");
		//let name = this.getRest();
		if(parent)
		{
			let newracc = new VisualRenderer(parent, "main");
			this.objectStack.unshift(newracc);	
		    return true;
		}
		console.log("fuck");
		return true;
	},
	"LDVAR": function(current)
	{
		if(current.type != "renderer")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let A = this.getInt();
		let B = this.getWord();
        current.instructions.push(["LDVAR", A, B]);
		return true;
	},
	"LDNUM": function(current)
	{
		if(current.type != "renderer")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let A = this.getInt();
		let B = this.getInt();
        current.instructions.push(["LDNUM", A, B]);
		return true;
	},
	"INC": function(current)
	{
		if(current.type != "renderer")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let A = this.getInt();
        current.instructions.push(["INC", A]);
		return true;
	},
	"DEC": function(current)
	{
		if(current.type != "renderer")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let A = this.getInt();
        current.instructions.push(["DEC", A]);
		return true;
	},
	"MUL": function(current)
	{
		if(current.type != "renderer")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let A = this.getInt();
		let B = this.getInt();
		let C = this.getInt();
        current.instructions.push(["MUL", A, B, C]);
		return true;
	},
	"PEN": function(current)
	{
		if(current.type != "renderer")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let A = this.getInt();
		let B = this.getRest();
        current.instructions.push(["PEN", A, B]);
		return true;
	},
	"FILL": function(current)
	{
		if(current.type != "renderer")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let A = this.getRest();
        current.instructions.push(["FILL", A]);
		return true;
	},
	"FONT": function(current)
	{
		if(current.type != "renderer")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let A = this.getRest();
        current.instructions.push(["FONT", A]);
		return true;
	},
	"RECT": function(current)
	{
		if(current.type != "renderer")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let A = this.getInt();
		let B = this.getInt();
		let C = this.getInt();
		let D = this.getInt();
        current.instructions.push(["RECT", A, B, C, D]);
		return true;
	},
	"DVAR": function(current)
	{
		if(current.type != "renderer")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let A = this.getInt();
		let B = this.getInt();
		let C = this.getInt();
        current.instructions.push(["DVAR", A, B, C]);
		return true;
	}

};