
/**
 * Top-level container for all the wiring articles and other "movable" items
 */
class VisualLineMap extends VisualItem
{
	/**
	 * Contains any links not associated with a line.
	 */
	looseLinks = null;
	constructor(name){
		 super("linemap", name, null);
		}
	commit(parser)
	{
		let existinglooselinks = this.find("looseLinks");
		if(existinglooselinks)
		{
			this.looseLinks=existinglooselinks;
			console.log("Loaded existing loose links line");
		}
		else
		{
			this.looseLinks= new VisualLine(this,"looseLinks");
			this.looseLinks.label = "Loose links";
			this.subItems.push(this.looseLinks);
			console.log("Created loose links line");
		}
	}
}