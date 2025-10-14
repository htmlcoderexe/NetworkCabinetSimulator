
/**
 * Sockets are inside frames and have wires connected to them
 */
class VisualSocket extends VisualItem
{
	/**
	 * List of wires currently connected
	 */
	connections = [];
	/**
	 * Renderer assigned to the socket.
	 */
	renderer = null;
	/**
	 * stores the connector's type name (such as RJ45 or SC)
	 */
	typename = "generic";
	constructor(frame, name)
	{
		super("socket", name, frame);
		this.selectionOrder = 5;
	}
	getLabel()
	{
		// if no label, shows as "5", if label is applied, shows as "(5) label"
		return this.label==""?this.name : "(" + this.name + ") " + this.label;
	}
	updateSize()
	{
		super.updateSize();
	}
	updatePosition()
	{
		// #TODO: fix the hardcoded value for the various offsets used here
		this.cX = this.x + this.parent.cX + DIM_FRAME_SIDES + 5;
		this.cY = this.y + this.parent.cY + 2;
		// if inside collapsed item, stick it to the top left of the item
		if(this.collapseView)
		{
			this.cX =this.parent.cX;
			this.cY = this.parent.cY;
		}
		super.updatePosition();
	}
	draw(ctx) 
	{
		VisualEditor.drawCallCount++;
		// fill out the socket's dimensions with white background
		ctx.fillStyle="#FFFFFF";
		ctx.fillRect(this.cX+0.0,this.cY+1,this.width,this.height-2);
		// draw markers indicated connected lines if any
		const lines = this.connections.length;
		for(let i=0;i<lines;i++)
		{
			ctx.lineWidth = 4;
			ctx.beginPath();
			// the Y coordinate here splits the socket's height between each
			// distinct line
			// 1 line draws from 0.0 to 1.0
			// 2 lines draw from 0.0 to 0.5 and from 0.5 to 1.0
			// etc
			ctx.moveTo(this.cX+2,this.cY + Math.floor(i* this.height/lines));
			ctx.lineTo(this.cX+2,this.cY + Math.floor((i+1)* this.height/lines));
			ctx.strokeStyle = this.connections[i].parent.colour1;
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(this.cX+this.width-3,this.cY + Math.floor(i* this.height/lines));
			ctx.lineTo(this.cX+this.width-3,this.cY + Math.floor((i+1)* this.height/lines));
			ctx.strokeStyle = this.connections[i].parent.colour2;
			ctx.stroke();
		}
		// run the renderer to draw the actual socket
		const rr = new ItemRenderer(ctx, this.renderer.instructions);
		rr.render(this);
	}
	drawTop(ctx)
	{
		this.draw(ctx);
	}
	/**
	 * Connects a given wire to the socket
	 * @param {VisualPatch} wire 
	 */
	connect(wire)
	{
		console.log("connected <", wire.getFullLabel(),"> to <", this.getFullLabel(), ">");
		this.connections.push(wire);
	}
	/**
	 * Disconnects a given wire from the socket
	 * @param {VisualPatch} wire 
	 */
	disconnect(wire)
	{
		console.log("disconnected <", wire.getFullLabel(),"> from <", this.getFullLabel(), ">");
		this.connections = this.connections.filter(item=>item!==wire);
	}
	/**
	 * Checks if the wire is connected to this socket and can be moved
	 * @param {VisualPatch} wire - wire to check
	 * @returns {boolean}
	 */
	canMove(wire)
	{
		return (wire.to == this || wire.from == this);
	}
	/**
	 * Checks if a connection from a given wire's Line can be added to the socket
	 * In effect, checks if the Line already exists on the socket
	 * @param {VisualPatch} wire 
	 * @returns 
	 */
	canAdd(wire)
	{
		const results = this.connections.filter(item=>item.parent == wire.parent);
		return results.length == 0;
	}
	/**
	 * Checks if a wire's Line can be extended to this socket
	 * @param {VisualPatch} wire 
	 * @returns 
	 */
	canStart(wire)
	{
		const results = this.connections.filter(item=>item.parent == wire.parent);
		return results.length ==1;
	}
	getDrawingGroup()
	{
		// when highlighting the socket, also highlight any wires attached
		return [this, ...this.connections];
	}
	/**
	 * Disconnects a wire from the given socket, and the other wire that belongs to the same line
	 * as the supplied reference wire. Then, attaches both to this socket.
	 * If no other wire is attached, then only the given wire is moved.
	 * @param {VisualPatch} other - the socket to disconnect from
	 * @param {VisualPatch} wire - wire to disconnect
	 */
	takeFrom(other, wire)
	{
		// determine if the wire starts or ends at this socket
		let thisIsFrom = wire.from == other;
		let otherWire = null;
		// first, remove the wire from the target socket
		other.disconnect(wire);
		// find the other link on same connection
		otherWire = other.connections.find((item)=>item.parent.name == wire.parent.name);
		// assign the wires' endpoints as applicable
		this.connect(wire);
		if(thisIsFrom)
		{
			wire.from = this;
		}
		else
		{
			wire.to = this;
		}
		if(otherWire)
		{
			if(thisIsFrom)
			{
				otherWire.to = this;
			}
			else
			{
				otherWire.from = this;
			}
			other.disconnect(otherWire);
			this.connect(otherWire);
		}
	}
}

