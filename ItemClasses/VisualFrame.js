
/**
 * A frame contains sockets to connect wires to
 */
class VisualFrame extends VisualItem
{
	isdynamic = false;
	renderer = null;
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
		if(!this.isdynamic)
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
		this.subtype=ftpl.subtype;
		//console.log(ftpl);
		// add sockets from the template
		ftpl.populateFrame(this,parser.inventory);
		// apply any custom labels
		this.subItems.forEach((socket)=>{
			if(this.socketlabels[socket.name])
			{
				socket.label = this.socketlabels[socket.name];
			}
		});
		//console.log(this);
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
		// also takes the rack's "offset" into account, as the lowest slot
		// number is rendered at the "0" position but might be non-0
		this.cY = this.y + this.parent.cY + (this.slot-this.parent.lowestSlot) * (this.height + DIM_FRAME_SPACING) + DIM_RACK_LABEL_SIZE;
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
		if(this.renderer)
		{
			let renderer = new ItemRenderer(ctx,this.renderer.instructions);
			renderer.offX=DIM_FRAME_SIDES+3;
			renderer.render(this);
		}
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
		if(this.renderer)
		{
			let renderer = new ItemRenderer(ctx,this.renderer.instructions);
			renderer.offX=DIM_FRAME_SIDES+3;
			renderer.render(this);
		}
		super.drawTop(ctx);
	}
	getDrawingGroup()
	{
		let result = [this];
		this.root.allOfType("cable")?.forEach((c)=>{
			if(c.from==this||c.to==this)
				result.push(c);
			});
		return result;
	}
	getPropSheet()
	{
		let sheet=[];
		let itemref=this.getFullName();
		// list any sockets with connections on them
		this.subItems.forEach((socket)=>{
			if(socket.connections.length>0)
			{
				// keep a list of already seen lines on this socket
				let knownLines = [];
				let socketLine = document.createElement("div");
				socketLine.dataset.itemref = itemref;
				let sname = document.createElement("span");
				sname.dataset.itemref = itemref;
				// display the name of the socket 
				sname.append("🔌" + socket.getLabel());
				socketLine.appendChild(sname);
				// followed by one or more line badges found in the connections
				socket.connections.forEach((conn)=>{
					// only go for badges not seen yet
					if(!knownLines.find((sl)=>sl==conn.parent))
					{
						knownLines.push(conn.parent);
						let badge = VisualEditor.createLineBadge(conn.parent);
						badge.dataset.itemref = itemref;
						socketLine.appendChild(badge);
						if(conn.parent.doContinuity)
						{
							if(socket!=conn.parent.start)
							{
								if(socket==conn.parent.end)
								{
									socketLine.append(" <-- ");
								}
								let s=conn.parent.start;
								socketLine.append(s.getLabel() + " @ [" + s.parent.getLabel()+"]");		
							}
							else
							{
								socketLine.append(" --> ");
							}
							if(socket!=conn.parent.end)
							{
								if(socket!=conn.parent.start)
								{
									socketLine.append(" --> ");
								}
								let s=conn.parent.end;
								socketLine.append(s.getLabel() + " @ [" + s.parent.getLabel()+"]");
							}
						}
						else
						{
							let isfrom=conn.from==socket;
							let otherend = isfrom?conn.to:conn.from;
							if(otherend)
							{
								socketLine.append(" "+(isfrom?"-->":"<--")+" "+otherend.getLabel() + " @ [" + otherend.parent.getLabel()+"]");
							}
						}
					}
				});
				sheet.push(socketLine);
			}
		});
		return sheet;
	}

	getCables()
	{
		let cables =[];
		this.root.allOfType("cable").forEach((c)=>{
			if(c.from==this)
			{
				cables.push({cable:c,otherEnd:c.to,start:true});
			}
			if(c.to==this)
			{
				cables.push({cable:c,otherEnd:c.from,start:false});
			}
		});
		return cables;
	}
}