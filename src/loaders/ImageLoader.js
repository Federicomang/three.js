import { Cache } from './Cache.js';
import { Loader } from './Loader.js';
import { FileLoader } from './FileLoader.js';
import { createElementNS, parseImageMIMEType } from '../utils.js';

class ImageLoader extends Loader {

	constructor( manager ) {

		super( manager );

	}

	load( url, onLoad, onProgress, onError ) {
		const originalUrl = url;

		if ( this.path !== undefined ) url = this.path + url;
		
		url = this.manager.resolveURL( url );
		
		const scope = this;

		function handleImage(fileUrl, fileLoader = false) {
			const image = createElementNS( 'img' );

			function onImageLoad() {

				removeEventListeners();

				if(!fileLoader) {
					Cache.add( fileUrl, this );
				}

				if ( onLoad ) onLoad( this );

				if(!fileLoader) {
					scope.manager.itemEnd( fileUrl );
				}
			}

			function onImageError( event ) {

				removeEventListeners();

				if ( onError ) onError( event );

				if(!fileLoader) {
					scope.manager.itemError( fileUrl );
					scope.manager.itemEnd( fileUrl );
				}
			}

			function removeEventListeners() {

				image.removeEventListener( 'load', onImageLoad, false );
				image.removeEventListener( 'error', onImageError, false );

			}

			image.addEventListener( 'load', onImageLoad, false );
			image.addEventListener( 'error', onImageError, false );

			if (fileUrl.slice( 0, 5 ) !== 'data:' ) {
				if ( scope.crossOrigin !== undefined ) image.crossOrigin = scope.crossOrigin;
			}

			if(!fileLoader) scope.manager.itemStart( fileUrl );

			image.src = fileUrl;

			return image;
		}

		if(this.withCredentials) {
			const loader = new FileLoader( this.manager );
			loader.setCrossOrigin( this.crossOrigin );
			loader.setResponseType( 'arraybuffer' );
			loader.setPath( this.path );
			loader.setWithCredentials( this.withCredentials );
			loader.setRequestHeader( this.requestHeader );
			
			const fileExtension = url.split('.').pop().toLowerCase();
			loader.load(originalUrl, ( buffer ) => {
				var blob = new Blob([buffer], { type: parseImageMIMEType(fileExtension)});
				var blobUrl = URL.createObjectURL(blob);
				handleImage(blobUrl, true);
			}, onProgress, onError );
		} else {
			const cached = Cache.get( url );

			if ( cached !== undefined ) {

				scope.manager.itemStart( url );

				setTimeout( function () {

					if ( onLoad ) onLoad( cached );

					scope.manager.itemEnd( url );

				}, 0 );

				return cached;
			}

			handleImage(url);
		}
	}

}


export { ImageLoader };
