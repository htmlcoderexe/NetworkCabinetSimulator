
const WARN_LOOSE_LABEL = 100;
const WARN_DUPLICATE_LABEL = 101;
const WARN_EMPTY_LABEL = 102;
const WARN_LOCATION_NO_NAME = 103;
const WARN_LOCATION_NO_LABEL = 104;
const WARN_LOOSE_RACK = 105;
const WARN_LOOSE_FRAME = 106;
const WARN_RACK_COLLISION = 107;
const WARN_FRAME_COLLISION = 108;
const WARN_LOCATION_OVERLAP = 109;
const WARN_BAD_FRAME_TPL = 110;

hw_warns = {
	100: "No object to attach LABEL to",
	101: "Duplicate LABEL",
	102: "Empty LABEL",
	103: "Location missing name",
	104: "Location missing label",
	105: "Rack missing parent",
	106: "Frame missing parent",
	107: "Rack slot already occupied",
	108: "Frame slot already occupied",
	109: "Locations %location1% and %location2% overlap",
	110: "Unknown frame template %frame_tpl_name%"
};
hwparser = {
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
	"SLOT": function(current)
	{
		if(!current)
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let slot = this.getInt();
		current.slot = slot-1;
		if(!slot)
		{
			this.statevars['last_param'] = 1;
			this.warn(this.WARN_MISSING_PARAM);
			current.slot = current.getNextSlot();
		}
		return true;
	},
	"TYPE": function(current)
	{
		if(!current)
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		let ftype = this.getWord();
		if(!ftype)
		{
			this.statevars['last_param'] = 1;
			this.warn(this.WARN_MISSING_PARAM);
		}
		if(current.type!="frame")
		{
			this.WARN_UNEXPECTED_TOKEN;
			return true;
		}
		current.frametype = ftype;
		return true;
	},
	"POSITION": function(current)
	{
		if(!current)
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		if(current.type!="location")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		const posx = this.getInt(true);
		const posy = this.getInt(true);
		current.x = posx;
		current.y = posy;
		return true;
	},
	"COMPACT": function(current)
	{
		if(!current)
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		if(current.type!="location")
		{
			this.warn(this.WARN_UNEXPECTED_TOKEN);
			return true;
		}
		current.collapseState = true;
		return true;
	},
	"LOCATION": function(current)
	{
		//console.log(this.objectStack);
		this.commit("");
		let name = this.getRest();
		if(this.rootObject.checkName(name))
		{
			this.err(this.ERR_NAME_COLLISION);
			return false;
		}
		let newloc = new VisualLocation(this.rootObject, name);
		this.objectStack.unshift(newloc);
		return true;
	},
	"RACK": function(current)
	{
		//console.log(this.objectStack);
		if(!this.checkParent("location"))
		{
			this.warn(WARN_LOOSE_RACK);
			return true;
		}
		let parent = this.commit("location");
		let name = this.getRest();
		if(parent)
		{
			if(parent.checkName(name))
			{
				this.err(this.ERR_NAME_COLLISION);
				return false;
			}
			let newracc = new VisualRack(parent, name);
			this.objectStack.unshift(newracc);	
		}
		return true;
	},
	"FRAME": function(current)
	{
		//console.log(this.objectStack);
		if(!this.checkParent("rack"))
		{
			this.warn(WARN_LOOSE_FRAME);
			return true;
		}
		let parent = this.commit("rack");
		let name = this.getRest();
		if(parent)
		{
			if(parent.checkName(name))
			{
				this.error(this.ERR_NAME_COLLISION);
				return false;
			}
			let newframe = new VisualFrame(parent, name);
			this.objectStack.unshift(newframe);	
		}
		return true;
	}
};
