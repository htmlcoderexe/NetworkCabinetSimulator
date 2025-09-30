const WARN_BAD_LINK = 201;
const WARN_ORPHAN_LINK = 202;

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
	"LINK": function(current)
	{
		//console.log(this.objectStack);
		if(!this.checkParent("line"))
		{
			this.warn(WARN_LOOSE_RACK);
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
		current.cable = cablename;
		return true;
	}

};