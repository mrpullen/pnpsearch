/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import get from 'get-value';


function noop() {
	return '';
}

/**
 * Registers a group helper on an instance of Handlebars.
 *
 * @type {Function}
 * @param {Object} handlebars Handlebars instance.
 * @return {Object} Handlebars instance.
 */
export default function groupBy(handlebars:typeof Handlebars): typeof Handlebars {
	const helpers = {
		/**
		 * @method group
		 * @param {Array} list
		 * @param {Object} options
		 * @param {Object} options.hash
		 * @param {String} options.hash.by
		 * @return {String} Rendered partial.
		 */
		group: function (list:Array<any>, options:Handlebars.HelperOptions) {
			options = options || {};

			let fn = options.fn || noop,
				inverse = options.inverse || noop,
				hash = options.hash,
				prop = hash && hash.by,
				keys: Array<any> = [],
				groups:any = {};

			if (!prop || !list || !list.length) {
				return inverse(this);
			}

			function groupKey(item: any): void {
				const key = get(item, prop);

				if (keys.indexOf(key) === -1) {
					keys.push(key);
				}

				if (!groups[key]) {
					groups[key] = {
						value: key,
						items: []
					};
				}

				groups[key].items.push(item);
			}

			function renderGroup(buffer:any, key:string): any {
				return buffer + fn(groups[key]);
			}

			list.forEach(groupKey);

			return keys.reduce(renderGroup, '');
		}
	};

	handlebars.registerHelper(helpers);

	return handlebars;
}

