
/**
 * Container for fixed installations, parent item for Locations
 */
class VisualMap extends VisualItem {
	constructor(name)
	{
		super("map", name);
	}
	doCables()
	{
		this.subItems.forEach((e)=>{
			if(e.type=="location")
				e.cables=[];
			
		});
		this.subItems.forEach((e)=>{
			if(e.type=="cable")
			{
				e.from.parent.parent.cables.push(e);
				e.to.parent.parent.cables.push(e);
			}
			
		});
	}
	updatePosition()
	{
		this.doCables();
		super.updatePosition();
	}
	cablesBetween(from,to)
	{
		const cables = [];
		this.subItems.forEach((e)=>{
			if(e.type=="cable")
			{
				if((e.from == from && e.to == to)||(e.from == to && e.to == from))
					cables.push(e);
			}
			
		});
		// console.log(cables);
		return cables;
	}
}