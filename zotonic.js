/**
 * Created with PyCharm.
 * User: jrad
 * Date: 5/13/13
 * Time: 11:48 AM
 * To change this template use File | Settings | File Templates.
 */

(function () {

    var async = require( 'async' );
    var request = require( 'request' );

    var zotonic = function( config ) {
        this.config = config;
    };

    zotonic.prototype.get = function( id, clbk ) {
        var URL = 'http://'+ this.config.host +'/rest/rsc/id/' + id;
        request( URL, function( err, resp, body ){
            clbk && clbk( err, JSON.parse( body ) );
        });
    };

    zotonic.prototype.update = function( id, clbk ) {
        // it seems zotonic doesn't support JSON based resource put
        clbk( {error: true, message: "Not Implemented"} );
    };

    zotonic.prototype.find_by_cat = function( query, options, clbk ){
        if( clbk == undefined && options != undefined ) {
            clbk = options;
            options = false;
        }
        var self = this;
        self.search( {cat: query, include_rsc: options }, clbk );
    };

    zotonic.prototype.find = function( query, clbk ){
        var self = this;
        self.search( {text: query}, clbk );
    };

    zotonic.prototype.search = function( query, clbk ) {
        var self = this;
        var finalClbk = function( err, results ) {
            async.map( results, self.get.bind( self ), function( err, results ) {
                clbk && clbk( err, results );
            });
        };
        if( query.include_rsc === false ) {
            finalClbk = clbk;
        }
        delete query.include_rsc;
//            hassubject=[123,'author']
//            hasobject=[123,'document']
//            sort='-rsc.modified'
//            custompivot=foo
//            hasobjectpredicate='document'
//            hasobject='author'
//            query_id, text, cat
        this.apiCall( {
            module: 'search',
            method: 'search',
            params: query
        }, finalClbk );
    };

    // Simpler version of apiCall
    zotonic.prototype.api = function( path, options, clbk ) {
        if( !clbk && options ) {
            clbk = options;
            options = null;
        }
        var tokens = path.split( "/" );
        this.apiCall({
            module: tokens[0],
            method: tokens[1],
            auth: options && options.auth,
            params: options && options.params,
            data: options && options.data
        }, clbk );
    };

    zotonic.prototype.apiCall = function( options, clbk ) {
        var self = this;
        var URL = 'http://'+ this.config.host +'/api/'+options.module+(options.method ? '/'+options.method: '');
        request({
            url: URL,
            method: options.data ? 'POST' : 'GET',
            auth: options.auth ? {
                'user': self.config.user,
                'pass': self.config.pass,
                'sendImmediately': true
            } : null,
            qs: options.params,
            body: options.data ? JSON.stringify( options.data ) : null
        }, function( err, resp, body ){
            try{
                clbk && clbk( err, JSON.parse( body ) );
            } catch(e ) {
                clbk && clbk( err || body );
            }
        });
    };

    /**
     * for inline access to media content
     * @param id
     * @param clbk
     */
    zotonic.prototype.media = function( id, clbk ) {
        var URL = 'http://'+ this.config.host +'/media/inline/id/' + id;
        request( URL, function( err, resp, body ){
            clbk && clbk( err, body );
        });
    };

    /**
     * build the correct url to access media content
     * @param rsc
     * @returns {*}
     */
    zotonic.prototype.get_medium_url = function( rsc ) {
        return rsc.medium && (rsc.medium.medium_url.split( "id" )[0] + rsc.medium.filename);
    };


    zotonic.prototype.upload = function( readStream, options, clbk ) {
        var self = this;
        var URL = 'http://'+ this.config.host +'/api/base/media_upload';
        var FormData = require('form-data');
        var fs = require('fs');
        if( !clbk && options ) {
            clbk = options;
        }
        var form = new FormData();
        //title, summary, body
        if( options && options.title ) {
            form.append( 'title', options.title );
        }
        if( options && options.summary ) {
            form.append( 'summary', options.summary );
        }
        if( options && options.body ) {
            form.append( 'body', options.body );
        }
        form.append( 'file', readStream );
        form.getLength(function(err, length) {
            request.post({
                url: URL,
                headers: {
                    'content-length': length // 26xxxx
                },
                auth: {
                    'user': self.config.user,
                    'pass': self.config.pass,
                    'sendImmediately': true
                }
            }, function(err, res, body) {
                if( err ) {
                    return clbk && clbk( err );
                }
                try {
                    var v = JSON.parse(body);
                } catch(e){
                    err = body;
                }
                clbk && clbk( err, v);
            })._form = form;
        });
    };

    zotonic.prototype.login = function( user, pass, clbk ) {
        login( user, pass, clbk );
    };

    function login( user, pass, clbk ) {
        var URL = 'http://'+ this.config.host + '/postback?postback=eUKvU5F5yDss_cr_M-ieYIdWAd2DaAVrAAZzdWJtaXRkAAl1bmRlZmluZWRkAAl1bmRlZmluZWRqZAAQY29udHJvbGxlcl9sb2dvbg';
        request.post({
            url: URL,
            form: { username: user, password: pass }},
            function( err, response, body ) {
                if( err ) return clbk && clbk( err );
                if( response.statusCode == 200 && body.indexOf( 'window' ) == 1 ) {
                    console.log( "=== ", response.headers['set-cookie'] );
                    return clbk && clbk( null, true );
                }
                return clbk && clbk( { error: true, message: "unauthorized" });
            }
        );
    }

    /*login( 'admin', 'admin', function(err, status) {
        if( err || !status ) {
            console.log( "Not logged in to Zotonic: ", err );
        } else {
            console.log( "Logged In to Zotonic as ", 'admin' );
        }
    });*/



    /*var qs = require('querystring')
        ,CONSUMER_KEY = 'pTRwmxM/tAcoBxNXaQ1Yg/hUbvs='
        ,CONSUMER_SECRET = 'eb+gCOpx4+peZWRYLbjl3sVnOS8='
      , oauth =
        { callback: 'http://192.168.254.113:3030/'
        , consumer_key: CONSUMER_KEY
        , consumer_secret: CONSUMER_SECRET
        }
      , url = 'http://192.168.254.113:8000/oauth/request_token'
      ;
    request.post({url:url, oauth:oauth}, function (e, r, body) {
      // Ideally, you would take the body in the response
      // and construct a URL that a user clicks on (like a sign in button).
      // The verifier is only available in the response after a user has
      // verified with twitter that they are authorizing your app.
      var access_token = qs.parse(body)
        , oauth =
          { consumer_key: CONSUMER_KEY
          , consumer_secret: CONSUMER_SECRET
          , token: access_token.oauth_token
          , token_secret: access_token.oauth_token_secret
          }
        , url = 'http://192.168.254.113:8000/oauth/access_token'
        ;
        console.log( access_token );
      request.post({url:url, oauth:oauth}, function (e, r, body) {
        var perm_token = qs.parse(body)
          , oauth =
            { consumer_key: CONSUMER_KEY
            , consumer_secret: CONSUMER_SECRET
            , token: perm_token.oauth_token
            , token_secret: perm_token.oauth_token_secret
            }
          , url = 'http://192.168.254.113:8000/'
          , params =
            { screen_name: perm_token.screen_name
            , user_id: perm_token.user_id
            }
          ;
          console.log( perm_token );
        url += qs.stringify(params)
        URL = 'http://'+ opxi2.CONFIG.cms.host +'/api/base/media_upload';
        request.get({url:URL, oauth:oauth,
            multipart: [
                {
                    'content-type': 'application/json',
                    body: JSON.stringify({
                        foo: 'bar', _attachments: {'message.txt': {follows: true, length: 18, 'content_type': 'text/plain' }}
                    })
                }
            ]
        }, function (e, r, user) {
          console.log(user);
        })
      })
    })*/

    module.exports = function( config ) {
        return new zotonic( config );
    };

})();