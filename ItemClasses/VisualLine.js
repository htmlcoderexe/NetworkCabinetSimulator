
/**
 * Defines a "line" - a contiguous set of wire links with two defined end points.
 */
class VisualLine extends VisualItem {

	/**
	 * One of the two colours making up the line's colour code
	 */
	colour1 = "#808080";
	/**
	 * One of the two colours making up the line's colour code
	 */
	colour2 = "#808080";

    /**
    Computed starting point of the line
     */
    start = null;
    /**
    Computed starting point of the line
     */
    end = null;
	
	constructor(map, name) {
		super("line", name, map);
	}
	
	toCode(indent_level)
	{
		let output ="";
		output+=this._f("line",indent_level,this.name);
		output+=this._f("colour1",indent_level+1, this.colour1);
		output+=this._f("colour2",indent_level+1, this.colour2);
		// only write the label if actually set
		if(this.label!="")
		{
			output+=this._f("label", indent_level+1, this.label)
		}
		return output+super.toCode(indent_level);
	}
	getDrawingGroup()
	{
		const grp = [];
		// the line itself has no highlighting
		// instead, highlight all its links
		// technically, each socket bar endpoints is highlighted twice
		// this is okay
		this.subItems.forEach((item)=>{
			grp.push(...item.getDrawingGroup());
		});
		return grp;
	}

	commit(parser)
	{
		if(this.name == "looseLinks")
		{
			return true;
		}
		// walk thorough the entire line, ensuring all links
		// are in the correct order and detecting any anomalies
		
		// keep track of sockets seen as a link's starting or ending point
		let seenFroms = [];
		let seenTos = [];
		// also keep track of which points have been seen before
		let seenConnections = [];
		// go through every item, noting down the points visited by each link
		this.subItems.forEach((link)=>{
			// get the endpoints
			let thisFrom = link.from;
			let thisTo = link.to;
			// if any endpoints are missing, that link is bad
			if(!thisFrom || !thisTo)
			{
				parser?.warn(WARN_BAD_LINK);
				// skip the bad link
				return false;
			}
			// if the endpoint is already in the list, remove it
			if(seenConnections.find((conn)=>conn === thisFrom))
			{
				seenConnections = seenConnections.filter((conn2)=>conn2 !== thisFrom);
			}
			// else add it to the list
			// any connection seen an even amount of times will be gone
			// any odd amount will remain
			else
			{
				seenConnections.push(thisFrom);
			}
			// do the same as above
			if(seenConnections.find((conn)=>conn === thisTo))
			{
				seenConnections = seenConnections.filter((conn2)=>conn2 !== thisTo);
			}
			else
			{
				seenConnections.push(thisTo);
			}
			
			// log all connections
			seenFroms.push(thisFrom);
			seenTos.push(thisTo);
		});
		// in a properly formed line, there should be exactly two endpoints that
		// are each visited only by one link - the start and the end
		console.log(seenConnections);
		if(seenConnections.length !=2)
		{
			// malformed line
			// #TODO: something
		}
		else
		{
			// determine start point
			let currentPoint = null;
			let nextPoint = null;
			// clone the array of links
			let availableLinks = this.subItems.slice();
			// pick one of the remaining points as the start 
			// this is not 100% reliable as there may be cases where
			// both points are a start point for a link or both are an end point
			// but this is a sane heuristic
			if(seenFroms.find((conn)=>conn == seenConnections[0]))
			// [0] is the start
			{
				this.start = seenConnections[0];
				this.end = seenConnections[1];
			}
			else
			{
				this.start = seenConnections[1];
				this.end = seenConnections[0];
			}
			// begin with the starting point
			currentPoint = this.start;
			// init a link number counter
			let linkIdCounter = 0;		   // |v|   a sensible safeguard        |v|
			while(currentPoint!==this.end && linkIdCounter < this.subItems.length)
			{
				// find a link that connects to the current point
				let linked = availableLinks.filter((link)=>
					(link.to === currentPoint || link.from ===currentPoint)
					);
				if(linked.length<1)
				{
					// discontinuity??
					break;
				}
				if(linked.length>1)
				{
					// some other discrepancy, branching?
					break;
				}
				// else should only be one link, use it
				let currentLink = linked[0];
				// designate the other end of the link as the next point
				nextPoint = currentLink.from === currentPoint ? currentLink.to : currentLink.from;
				// pick the link out
				currentLink.unlink();
				// connect the link in correct direction
				currentLink.from = currentPoint;
				currentLink.to = nextPoint;
				// this notifies the sockets of the connection changes
				currentLink.commit(parser);
				// number the link
				currentLink.name = linkIdCounter;
				// advance to the next point
				currentPoint = nextPoint;
				// remove the newly processed link from the candidates
				availableLinks = availableLinks.filter((link)=>link!==currentLink);
				// increment the link number
				linkIdCounter++;
				console.log("renumbered", currentLink, "to ", linkIdCounter-1);
			}
		// put the links in the new order inside the Line
		this.subItems.sort((a,b)=>a.name - b.name);
		}
		return true;
	}
	/**
	 * Finds a link between two specified sockets
	 * @param {VisualSocket} socket1 
	 * @param {VisualSocket} socket2 
	 * @returns {VisualPatch?} - a link if one is found in this Line 
	 */
	getLinkBetween(socket1, socket2)
	{
		// check both directions
		return this.subItems.find((link)=>
		(link.to === socket1 && link.from ===socket2)
		|| (link.to === socket2 && link.from ===socket1)
		);
	}
	/**
	 * Finds any links in this Line that connect to the specified socket.
	 * @param {VisualSocket} socket 
	 * @returns {VisualPatch[]} - an array containing any links found 
	 */
	getLinksVisiting(socket)
	{
		return this.subItems.filter((link)=>
		(link.to === socket || link.from ===socket)
		);
	}
    /**
     * Reverses the line's direction.
     */
     reverse()
     {
        this.subItems.forEach((l)=>{
            l.reverse();
        });
        let tmp = this.start;
        this.start = this.end;
        this.end = tmp;
        this.updatePosition();
        this.updateSize();
        this.updateHitboxMapping();
        
     }
}
