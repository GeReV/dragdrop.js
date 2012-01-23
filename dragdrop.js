(function(window, document) {
	var ddpoly,
		div				= document.createElement('div'),
		initialMouseX	= undefined,
		initialMouseY	= undefined,
		startX			= undefined,
		startY			= undefined,
		originalObject	= undefined,
		draggedObject	= undefined,
		dragEvent		= undefined,
		bind,
		trigger,
		createEvent;
	
	if ( ! (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) ) { // Modernizr's native drag & drop test.
		return;
	}
	
	ddpoly = window.ddpoly = (window.ddpoly || {});
		
	bind = ddpoly.bind = (function () {
		if ( document.addEventListener ) {
			return function( el, type, fn ) {
				var i;
				
				if ( el && el.length ) {
					i = el.length;
					while (i--) {
						bind( el[i], type, fn );
					}
				}
				
				el.addEventListener && el.addEventListener( type, fn, false );
			};
		}
		else if ( document.attachEvent ) {
			return function( el, type, fn ) {
				var i;
				
				if ( el && el.length ) {
					i = el.length;
					while (i--) {
						bind( el[i], type, fn );
					}
				}
				
				el.attachEvent && el.attachEvent( 'on' + type, function () { 
					return fn.call(el, window.event);
				});
			};
		}
	})();
		
	createEvent = ddpoly.createEvent = function (name) {
		var e;
		
		if ( document.createEvent ) {
		    e = document.createEvent( "HTMLEvents" );
		    e.initEvent( name, true, true );
		} else {
			e = document.createEventObject();
			e.eventType = 'on' + name;
		}

		return e;
	};
	
	trigger = ddpoly.trigger = function (el, e) {
		if (el.dispatchEvent) {
			el.dispatchEvent(e);
		} else {
			el.fireEvent(e.eventType, e);
		}
	};
	
	ddpoly.events = {
		mousedown: function (e) {
			ddpoly.capture( e.target, e );
			ddpoly.setPosition( 0, 0 );
			
			initialMouseX = e.clientX;
			initialMouseY = e.clientY;
			
			return false;
		},
		mousemove: function (e) {
			if ( draggedObject ) {
				var dX = e.clientX - initialMouseX,
					dY = e.clientY - initialMouseY;
				
				ddpoly.setPosition( dX, dY );
			}
		},
		mouseup: function () {
			ddpoly.release.call(this);
		}
	};
	
	ddpoly.getDraggableElements = function () {
		var elements = document.getElementsByTagName('*'),
			filtered = [],
			i = elements.length,
			attribute;
		
		while (i--) {
			attribute = elements[i].getAttribute('draggable');
			if (typeof attribute === 'string' && /^\\s*true\\s*$/i.test(attribute)) {
				filtered.push(elements[i]);
			}
		}
		
		return filtered;
	};
	
	ddpoly.init = function () {
		
		var elements = document.querySelectorAll ? document.querySelectorAll('[draggable=true]') : ddpoly.getDraggableElements();
		
		bind( elements, 'mousedown', ddpoly.events.mousedown );
		
		bind( document, 'mousemove', ddpoly.events.mousemove );
		bind( document, 'mouseup', ddpoly.events.mouseup );
		
	};
		
	ddpoly.capture = function (obj, evt) {					
		var e = dragEvent = createEvent('dragstart');
		
		e.dataTransfer = ddpoly.getDataTransfer();
		e.target = evt.target;
		
		trigger( obj, e );
		
		if (draggedObject) {
			//Dragger.options.shim.release();
		}
		
		startX = obj.offsetLeft;
		startY = obj.offsetTop;
		
		originalObject = obj;
		
		if (e.dataTransfer.effectAllowed.toLowerCase() == 'move') {
			draggedObject = obj;
		} else {
			draggedObject = obj.cloneNode(true);
			(document.documentElement || document.body).appendChild(draggedObject); 
		}
		
		draggedObject.style.position	= 'absolute';
		draggedObject.style.left		= obj.offsetLeft;
		draggedObject.style.left		= obj.offsetTop;
	};
		
	ddpoly.release = function () {
		var e;
		
		if ( draggedObject ) {
			e = createEvent('dragend');
			
			e.dataTransfer = dragEvent.dataTransfer;
			e.target = dragEvent.target;
			
			trigger( originalObject, e );
			
			//TODO: Consider other cases.
			switch ( e.dataTransfer.effectAllowed.toLowerCase() ) {
				case 'move':
					draggedObject.style.position = draggedObject.style.left = draggedObject.style.top = '';
					break;
				case 'copy':
					if ( draggedObject.parentNode ) {
						draggedObject.parentNode.removeChild( draggedObject );
					}
					break;
			}					
			
			originalObject = draggedObject = dragEvent = null;
		}
	};
		
	ddpoly.setPosition = function (dx,dy) {
		draggedObject.style.left	= startX + dx + 'px';
		draggedObject.style.top		= startY + dy + 'px';
	};
		
	ddpoly.getDataTransfer = function () {
		return (function () {
			var items = {};
			
			function ensureFormat (format) {
				format = format.toLowerCase();
					
				if ( format == 'text' ) {
					format = 'text/plain';
				}
				if ( format == 'url' ) {
					format = 'text/uri-list';
				}
				
				return format;
			}
			
			return {
				// TODO: Improve DataTransfer interface shim. (http://www.whatwg.org/specs/web-apps/current-work/multipage/dnd.html#the-datatransfer-interface)
				dropEffect: 'copy',
				effectAllowed: 'copy',
				setData: function (format, value) {
					items[ ensureFormat( format ) ] = value;
				},
				getData: function (format) {
					return items[ ensureFormat( format ) ];
				},
				clearData: function (format) {
					if ( typeof format === 'undefined' ) {
						items = {};
						return;
					}
					
					delete items[ ensureFormat( format ) ];
				}
			};
		})();
	}
	
	ddpoly.init();
})(window, document);