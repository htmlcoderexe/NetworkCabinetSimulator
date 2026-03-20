const WARN_BAD_LINK = 201;
const WARN_ORPHAN_LINK = 202;
const WARN_LOOP = 203;
const WARN_DISJOINT_LINK = 204;
const WARN_UNKNOWN_CABLE = 205;
const WARN_INVALID_PORT = 206;

route_warns = {
	100: "No object to attach LABEL to",
	102: "Empty LABEL",
	201: "Invalid link - one or more endpoints not defined or missing.",
	202: "Link not associated with a line",
	203: "Loop detected.",
	204: "Link not contiguous with the rest of the line.",
	205: "Cable %cable_name% does not exist.",
	206: "Port reference <%linkref%> invalid."
};
routeparser = {
	"COLOUR1": function(current)
	{
		if(!current || current.type != "line")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let text = this.getRest();
		if(!text)
		{
			this.statevars['last_param'] = 1;
			this.warn(this.WARN_MISSING_PARAM);
			current.colour1 = "#808080";
			return true;
		}
		current.colour1 = text;
		return true;
	},
	"COLOUR2": function(current)
	{
		if(!current || current.type != "line")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let text = this.getRest();
		if(!text)
		{
			this.statevars['last_param'] = 1;
			this.warn(this.WARN_MISSING_PARAM);
			current.colour2 = "#808080";
			return true;
		}
		current.colour2 = text;
		return true;
	},
	"LINE": function(current)
	{
		//console.log(this.objectStack);
		this.commit("");
		let name = this.getRest();
		if(this.rootObject.checkName(name))
		{
			this.err(this.ERR_NAME_COLLISION);
			return false;
		}
		let newline = new VisualLine(this.rootObject, name);
		this.objectStack.unshift(newline);
		return true;
	},
	"GROUP": function(current)
	{
		//console.log(this.objectStack);
		this.commit("");
		let name = this.getRest();
		if(this.rootObject.checkName(name))
		{
			this.err(this.ERR_NAME_COLLISION);
			return false;
		}
		let newline = new VisualLine(this.rootObject, name);
		newline.doContinuity=false;
		this.objectStack.unshift(newline);
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
	"LINK": function(current)
	{
		//console.log(this.objectStack);
		if(!this.checkParent("line"))
		{
			this.warn(WARN_ORPHAN_LINK);
			return true;
		}
		let parent = this.commit("line");
		//let name = this.getRest();
		if(parent)
		{
			if(false && parent.checkName(name))
			{
				this.err(this.ERR_NAME_COLLISION);
				return false;
			}
			let newracc = new VisualPatch(parent, parent.getNextSlot());
			this.objectStack.unshift(newracc);	
		return true;
		}
		console.log("fuck");
		return true;
	},
	"FROM": function(current)
	{
		if(current.type != "patch")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let A = this.getWord();
		let B = this.getWord();
		let C = this.getWord();
		let D = this.getWord();
		let point = this.terrain.find(A,B,C,D);
		//console.log(A,B,C,D);
		//console.log(point);
		if(point && point.type=="socket")
		{
			current.from = point;
		}
		else
		{
			this.statevars['linkref']=[A,B,C,D].join("$");
			this.warn(WARN_INVALID_PORT);
		}
		return true;
	},
	"TO": function(current)
	{
		if(current.type != "patch")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let A = this.getWord();
		let B = this.getWord();
		let C = this.getWord();
		let D = this.getWord();
		let point = this.terrain.find(A,B,C,D);
		//console.log(A,B,C,D);
		//console.log(point);
		if(point && point.type=="socket")
		{
			current.to = point;
		}
		else
		{
			this.statevars['linkref']=[A,B,C,D].join("$");
			this.warn(WARN_INVALID_PORT);
		}
		return true;
	},
	"CABLE": function(current)
	{
		if(current.type != "patch")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let cablename = this.getWord();
		let cable = this.terrain.find(cablename);
		if(!cable)
		{
			if(cablename!="PATCH" && cablename!="")
			{
				this.statevars["cable_name"]=cablename;
				this.warn(WARN_UNKNOWN_CABLE);
			}
		}
		else
		{
			current.cable = cable;
			cable.addItem(current);
		}
		current.cableName = cablename;
		return true;
	}

};