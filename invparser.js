
const WARN_CONNECTOR_MISSING = 103;
/*
const WARN_LOCATION_NO_LABEL = 104;
const WARN_LOOSE_RACK = 105;
const WARN_LOOSE_FRAME = 106;
const WARN_RACK_COLLISION = 107;
const WARN_FRAME_COLLISION = 108;
const WARN_LOCATION_OVERLAP = 109;
//*/
inv_warns = {
	100: "No object to attach LABEL to",
	101: "Duplicate LABEL",
	102: "Empty LABEL",
	103: "Missing connector of type %conn_type%",
	104: "Location missing label",
	105: "Rack missing parent",
	106: "Frame missing parent",
	107: "Rack slot already occupied",
	108: "Frame slot already occupied",
	109: "Locations %location1% and %location2% overlap" 
};

invparser = {
	"FRAME": function(current)
	{
		this.commit("");
		let name = this.getRest();
		if(this.rootObject.checkName(name))
		{
			this.err(this.ERR_NAME_COLLISION);
			return false;
		}
		let newframe = new VisualFrameTemplate(this.rootObject, name);
		this.objectStack.unshift(newframe);
		return true;
		
	},
	// needed to resolve ambiguity between CONNECTOR starting a new connector def or adding a connector to a frame
	"NEXT": function(current)
	{
		this.commit("");
		return true;
		
	},
	"CONNECTOR": function(current)
	{
		// under a frame template this keyword adds connectors
		if(current.type=="frame_tpl")
		{
			let name = this.getWord();
			let x = this.getInt();
			let y = this.getInt();
			let conn = this.rootObject.find(name);
			if(!conn)
			{
				// missing connector def
				// put a warn or something idk lol
				this.statevars['conn_type'] = name;
				this.warn(WARN_CONNECTOR_MISSING);
				return true;
			}
			current.elements.push({name: name, type: "connector", x: x, y: y});
			return true;
		}
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
		let B = this.getInt();
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