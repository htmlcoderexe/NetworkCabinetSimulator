

/**
 * Represents a single connection (link, wire) between two endpoints (sockets).
 */
class VisualPatch extends VisualItem {
	/**
	 * The start point of this link.
	 */
	from = null;
	/**
	 * The end point of this link.
	 */
	to = null;
	/**
	 * An optional name of a bundle, cable or other group associated with this link.
	 */
	cable =null;
	cableName="";
	constructor(line, name)	{
		super("patch", name, line);
		this.selectionOrder = 4;
	}
	
	toCode(indent_level)
	{
		let output ="";
		output+=this._f("link",indent_level,this.name);
		// write the label if one is set
		if(this.label!="")
		{
			output+=this._f("label", indent_level+1, this.label)
		}
		output+=this._f("from",indent_level+1, this.from.getFullName(" ").substring(10));
		output+=this._f("to",indent_level+1, this.to.getFullName(" ").substring(10));
		output+=this._f("cable", indent_level+1, this.cable?this.cable.name:this.cableName)
		return output;
	}
	getLabel()
	{
		// if the link has a label, include its number in the display string
		return this.label==""?this.name : "(" + this.name + ") " + this.label;
	}
	commit(parser)
	{
		// fail the link if either or both endpoints are not set
		if(!this.to || !this.from)
		{
			parser.warn(WARN_BAD_LINK);
			return false;
		}
		// notify both endpoints of the connection
		this.to.connect(this);
		this.from.connect(this);
		return true;
	}
	/**
	 * Disconnects this link from its endpoints.
	 */
	unlink()
	{
		this.to.disconnect(this);
		this.from.disconnect(this);
		this.to = null;
		this.from = null;
	}
    /**
     * Reverses the link's direction.
     */
    reverse()
    {
        let tmp = this.from;
        this.from = this.to;
        this.to = tmp;
    }
    
	updateSize()
	{
		super.updateSize();
	}
	updatePosition()
	{
		let startX,startY,endX,endY;
		// define a rectangle from the endpoints
		if(this.cable)
		{
			let index = this.cable.indexOf(this);
			let points = this.cable.getLinkEndPoints(index);
			startX=points.startX;
			startY=points.startY;
			endX=points.endX;
			endY=points.endY;
			console.log(points);
		}
		else
		{
			startX = this.from.cX;
			startY = this.from.cY;
			endX = this.to.cX + this.to.width;
			endY = this.to.cY + this.to.height;
		}
		// normalise the rectangle, making it have strictly positive width and height
		// this is done by picking the smallest of each coordinate
		this.cX = startX > endX ? endX : startX;
		this.cY = startY > endY ? endY : startY;
		// the line representing the link is one of the diagonals of the rectangle.
		// if both X and Y increase or decrease, that diagonal is from top-left to bottom-right
		// if their signs are different, the diagonal is "flipped".
		// in the following diagram, 4 links are illustrated
		// (O) is the starting point, and A, B, C, D are endpoints of 4 links
		// NB: the Y axis goes downwards in this coordinate system!
		//                                
		//           y-                        All 4 links have the exact same width and height calculated
		//           |                         for the bounding rectangle. The normalisation process moves
		//        A--b--B                      the coordinates then to match up to the original points. 
		//        |\ | /|					   Only the link OD remains unchanged here, as D has higher X and Y
		//        | \|/ |                      coordinates than O. OA switches the points around - A is the
		// x-  ---n--O--m----------> x+        starting coordinate for the rectangle now and it ends at O.
		//        | /|\ |                      The remaining two links create new points - OB becomes bm and
		//        |/ | \|                      OC becomes nc - but the "regular" diagonal is pointing the wrong
		//        C--c--D                      way, which is handled in the collision function.
		//           | 
		//           v
		//
		//           y+
		//         
		const dX = endX - startX;
		const dY = endY - startY;
		// fortunately, it easy to check if that's the case - the diagonal
		// only "flips" if exactly one of the pair of differences is negative
		// meaning the product of these difference is negative
		this.flip = (dX*dY) < 0;
		// set the resulting rectangle's size to the absolute value of the differences.
		this.width = Math.max(4,Math.abs(dX));
		this.height = Math.max(4,Math.abs(dY));
		super.updatePosition();
	}

	testHit(x, y)
	{
		// as a link is a line between two corners of its bounding rectangle,
		// test for the diagonal collision (selecting the "flipped" diagonal 
		// if determined by the code in the updatePosition method)
		return this.getRect().diagonal(x, y, 6, this.flip);
	}
	draw(ctx)
	{
		if(this.cable)
			return;
		VisualEditor.drawCallCount++;
		// save the drawing settings to restore later
		ctx.save();

		ctx.lineWidth = 3;
		// this controls how far the 2 lines will "spread" from the centreline
		let offset = 3;
		let vertical_margin = 3
		// determine the starting and ending points for the centreline
		// aim for the centreline of the sockets
		let startX = this.from.cX + (this.from.width/2);
		let endX = this.to.cX + (this.to.width/2);
		// starts at the top of the sockets, with a small hardcoded margin
		let startY = this.from.cY + vertical_margin;
		// ends at the bottom with the same margin
		let endY = this.to.cY + this.to.height - vertical_margin;
		// determine the angle (respective to the X axis)
		let angle = Math.atan2(endY-startY, endX-startX);
		// technically we are rotating the vector [0, offset] by the rotation matrix from the angle
		//
		//     [cos(θ) -sin(θ)]  [x]  =>    [x * cos(θ) - y * sin(θ)]
		//     [sin(θ)  cos(θ)]  [y]  =>    [x * sin(θ) + y * cos(θ)]
		//
		//
		// we get away with only doing half of the rotation matrix, as the X value is 0
		// 
		//   [x] => [-y * sin(θ)]
		//   [y] => [ y * cos(θ)]
		let rotX = -1 * (Math.sin(angle)) * offset;
		let rotY = Math.cos(angle) * offset;
		// draw the first line
		ctx.beginPath();
		ctx.moveTo(startX + rotX, startY+rotY);
		ctx.lineTo(endX + rotX,endY+rotY);
		ctx.strokeStyle =this.parent.colour1;
		ctx.stroke();
		ctx.beginPath();
		// flipping both coordinates of the offset is the same as rotating it by 180 degrees
		// which is conveniently the same as reflecting it 
		// which results in the second line being nicely positioned at the other side 
		ctx.moveTo(startX - rotX, startY-rotY);
		ctx.lineTo(endX - rotX,endY-rotY);
		ctx.strokeStyle =this.parent.colour2;
		ctx.stroke();
		// restore settings
		ctx.restore();
	}
	drawOutlineFunc(ctx)
	{
		// draw a single line right in the middle
		ctx.beginPath();
		
		if(this.cable)
		{
			let index = this.cable.indexOf(this);
			let points = this.cable.getLinkEndPoints(index);
			ctx.moveTo(points.startX,points.startY);
			ctx.lineTo(points.endX,points.endY);
			console.log(points);
		}
		else
		{
			ctx.moveTo(this.from.cX+(this.to.width/2), this.from.cY+3);
			ctx.lineTo(this.to.cX+(this.to.width/2),this.to.cY+this.to.height-3);
		}
		ctx.stroke();

	}
	getDrawingGroup()
	{
		// highlight both endpoints along with the link
		return [this.from,this,this.to];
	}
}
