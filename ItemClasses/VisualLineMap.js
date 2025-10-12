
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
		 this.looseLinks= new VisualLine(this,"looseLinks");
		 this.looseLinks.label = "Loose links";
		 this.subItems.push(this.looseLinks);
		}
}