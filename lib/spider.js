var request = require( 'request' );
var fs = require( 'fs' );
var iconv = require( 'iconv-lite' );
var cheerio = require( 'cheerio' );
var url = require( 'url' );
var util = require( 'util' );

module.exports = function( repositry, headers )
{
    this.repositry = repositry;

    this.headers = headers;

    var total = 0;

    function get( uri, func )
    {
        // Compose options for HTTP request
        var options = 
        {
            uri: uri.href,
            headers: headers
        };
        
        function next( href )
        {
            if( href == '#' )
                return;
            var resolved = url.resolve( uri, href );
            var parsed = url.parse( resolved );
            var protocol = parsed.protocol;
            if( protocol != 'http:' && protocol != 'https:' )
                return;
            setImmediate( get, parsed, func );
        }

        request( options, function( error, response, body )
        {
            var id = ++total;
            
            // Log error messae if having
            if( error )
            {
                console.log( '%d N/A [ERR] GET %s %j', id, uri.href, error );
                return;
            }
            
            var status = response.statusCode;
            var size = body.length;
            console.log( '%d %d [%d] GET %s', id, size, status, uri.href );
            
            // Persist data
            if( repositry != undefined )
            {
                fs.appendFile( repositry + 'data.txt', body, 'binary', function( e )
                {
                    if( e )
                        throw e;
                    console.log( '%d N/A [ERR] GET %s %j', id, uri.href, e );
                } );
            }
            
            // 
            if( status == 200 )
            {
                var html = iconv.decode( body, 'utf8' );
                var $ = cheerio.load( html );
                $("a[href]").each( function() { next( $(this).attr( 'href' ) ); } );
                $("frame[src]").each( function() { next( $(this).attr( 'src' ) ); } );
                $("iframe[src]").each( function() { next( $(this).attr( 'src' ) ); } );
            }
    
            // Execute callback function
            if( func != undefined )
                func( status, headers, body );
        } );
    };

    this.queue = function( uri, func )
    {
        if( typeof uri === 'string' )
            uri = url.parse( uri );
        get( uri, func );
    };
};
