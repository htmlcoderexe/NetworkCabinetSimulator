
/**
 * A frame contains sockets to connect wires to
 */
class VisualFrame extends VisualItem
{
	constructor(rack, name)
	{
		super("frame", name, rack);
		this.selectionOrder = 3;
		// standard sizes
		this.height = DIM_FRAME_HEIGHT + DIM_FRAME_BOTTOM;
		this.width = DIM_RACK_WIDTH;
		// defaults to dynamic assignment
		this.slot = -1;
		// contains the template used for the frame
		this.frametype = "";
		// contains any socket labels on sockets in this frame
		this.socketlabels = {};
	}
	toCode(indent_level)
	{
		let output ="";
		output+=this._f("frame",indent_level,this.name);
		//#TODO: only write this if a slot was specified in original file
		output+=this._f("slot",indent_level+1, this.slot+1);
		output+=this._f("type",indent_level+1, this.frametype);
		output+=this._f("label", indent_level+1, this.label);
		// sockets aren't stored in the file
		// any custom labels are stored with the frame
		this.subItems.forEach(socket => {
			if(socket.label!="")
			{	
				output+=this._f("socketlabel", indent_level+1, socket.name, socket.label);
			}
		});
		return output;
	}
	commit(parser)
	{
		if(!this.name)
		{
			parser.warn(WARN_LOCATION_NO_NAME);
			return false;
		}
		if(!this.label)
		{
			parser.warn(WARN_LOCATION_NO_LABEL);
		}
		// get the template
		let ftpl = parser.inventory.find(this.frametype);
		// reject the frame if the template reference is invalid
		if(!ftpl || ftpl.type!="frame_tpl")
		{
			parser.statevars['frame_tpl_name'] = this.frametype;
			parser.warn(WARN_BAD_FRAME_TPL);
			return false;
		}
		// add sockets from the template
		ftpl.elements.forEach((el)=>{
			switch(el.type)
			{
				// connectors are added directly
				case "connector":
				{
					let connref = parser.inventory.find(el.name);
					// make sure connector is valid
					if(!connref)
					{
						// this only fails the specific socket, not the whole frame
						return false;
					}
					let slot = this.getNextSlot();
					// #TODO: more clear numbering system
					// currently slots are 0-indexed internally but 1-indexed
					// for naming and display
					let conn = new VisualSocket(this, (slot+1).toString());
					conn.slot = slot;
					// the renderer is a subItem named "main"
					conn.renderer = connref.find("main");
					conn.width = connref.width;
					conn.height = connref.height;
					conn.x = el.x;
					conn.y = el.y;
					this.addItem(conn);
					break;
				}
				// banks are collections of connectors
				case "bank":
				{
					let bankref = parser.inventory.find(el.name);
					// validate the bank reference
					if(!bankref)
					{
						return false;
					}
					// same as the parent loop, go through each connector
					bankref.elements.forEach((el2)=>{
						let connref = parser.inventory.find(el2.name);
						if(!connref)
						{
							return false;
						}
						let slot = this.getNextSlot();
						let conn = new VisualSocket(this, (slot+1).toString());
						conn.slot = slot;
						conn.renderer = connref.find("main");
						conn.width = connref.width;
						conn.height = connref.height;
						conn.x = el2.x + el.x;
						conn.y = el2.y + el.y;
						this.addItem(conn);
					});
				}
				// any unexpected types are ignored
				default:
				{
					return;
				}
			}
		});
		// apply any custom labels
		this.subItems.forEach((socket)=>{
			if(this.socketlabels[socket.name])
			{
				socket.label = this.socketlabels[socket.name];
			}
		});
		return true;
	}

	updateSize()
	{
		super.updateSize();
		// standard size
		this.height = DIM_FRAME_HEIGHT + DIM_FRAME_BOTTOM;
		this.width = DIM_RACK_WIDTH;
		// unless collapsed
		if(this.collapseView)
		{
			this.height = 1;
			this.width = 1;
		}
	}
	updatePosition()
	{
		this.cX = this.x + this.parent.cX;
		// vertical position based on slot
		this.cY = this.y + this.parent.cY + this.slot * (this.height + DIM_FRAME_SPACING) + DIM_RACK_LABEL_SIZE;
		// if collapsed, every frame is at the same point
		// needed to force the sockets in the same spot for
		// wire visualisation when collapsed
		if(this.collapseView)
		{
			this.cX =this.parent.cX;
			this.cY = this.parent.cY;
		}
		super.updatePosition();
	}
	draw(ctx) 
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = "black";
		ctx.fillStyle = "black";
		const rect = this.getRect();
		// draw a rectangle of standard size
		// plenty of padding on the sides and bottom
		ctx.strokeRect(rect.x + 0.5 + DIM_FRAME_SIDES, rect.y + 0.5 + 2, DIM_FRAME_WIDTH-1, DIM_FRAME_HEIGHT-1);
		ctx.font ="20px monospace";
		// label on the bottom
		ctx.fillText(this.label, rect.x+this.width/2, rect.y+this.height-DIM_FRAME_SPACING/2 -7);
		// name on the left - should be a short numeric ID
		ctx.fillText(this.name, rect.x + DIM_FRAME_SIDES/2, rect.y + DIM_FRAME_HEIGHT-10);
		super.draw(ctx);
	}
	drawTop(ctx)
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = "black";
		ctx.fillStyle = "white";
		const rect = this.getRect();
		// fill a white background to override items underneath
		ctx.fillRect(rect.x + 0.5 + DIM_FRAME_SIDES, rect.y + 0.5 + 2, DIM_FRAME_WIDTH, DIM_FRAME_HEIGHT);
		ctx.strokeRect(rect.x + 0.5 + DIM_FRAME_SIDES, rect.y + 0.5 + 2, DIM_FRAME_WIDTH-1, DIM_FRAME_HEIGHT-1);
		super.drawTop(ctx);
	}
}