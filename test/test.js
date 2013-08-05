var fs = require( 'fs'),
    cms = require( "zotonic" )({
        "host": "192.168.254.113:8000",
        "user": "admin",
        "pass": "opxi2"
    });


function submit_cause_for_event( eid, cause_rsc_id, callerId, clbk ) {
    cms.api( "atm/event", { data: {
        method: "update",
        id: eid,
        x_modified_by: callerId,
        cause: cause_rsc_id
    }}, function( err, resp ){
        return clbk && clbk( err, resp );
    });
}

function upload_cause_and_update_event( eid, fileName/*'/home/jrad/niopdc-greeting.wav'*/, title, clbk ){
    /**
     * Upload a message to zotonic and attach it to a failure event
     */
    cms.upload( fs.createReadStream( fileName ), { title: title}, function( err, rsc ){
        if( err ) return clbk && clbk( err );
        cms.api( "atm/event", { data: {
            method: "update",
            id: eid,
            cause_media_id: rsc.rsc_id
        }}, function( err, resp ){
            return clbk && clbk( err, resp );
        });
    });
}


function fetch_event_by_id( e_id, clbk ) {
    /**
     * Read an ATM failure event
     */
    cms.api( "atm/event", {params:{ id: e_id}}, function( err, rsc ){
        clbk && clbk( err, rsc );
    });
}


function ensure_event_by_branch( e_id, b_id, clbk ) {
    cms.api( "atm/branch", { params: {
        id: e_id
    }}, function( err, branch ){
        if( err ) return clbk && clbk( err, false );
        return clbk && clbk( null, b_id == branch.id );
    });
}

function authorize_branch( b_id, pass, clbk ) {
    cms.search( {cat: "branch", text: b_id, include_rsc: true }, function( err, list ){
        console.log( "boro halesho bebar ", err, list );
        if( list.length == 0 ) {
            return clbk && clbk( err, false );
        }
        var rsc = list[0];
        if( rsc.password && rsc.password == pass ) {
            return clbk( err, true );
        } else if ( rsc.password == undefined && b_id == pass ) {
            return clbk( err, true );
        } else {
            return clbk( err, false );
        }
    });
}

/**
 * get list of cause's
 */
function find_causes( clbk ){
    cms.find_by_cat( "atm_failure_cause", true, function( err, list ){
        list = list.filter( function(rsc){
            return cms.get_medium_url( rsc );
        });
        list.sort( function( c1, c2 ){
            if( c1.order == undefined ) return 1;
            if( c2.order == undefined ) return -1;
            return c1.order > c2.order ? 1 : -1;
        });
        clbk && clbk( err, list );
    });
}


/**
 * get list of announcements
 */
function announce_of_the_day( clbk ){
    cms.find_by_cat( "announcement", true, function( err, list ){
        var announces = list.filter( function(rsc){
            var now = new Date();
            var start = new Date(rsc.date_start);
            var end = new Date(rsc.date_end);
            if( start<=now && now<=end ) {
                start.setFullYear( now.getFullYear() );
                start.setMonth( now.getMonth() );
                start.setDate( now.getDate() );
                end.setFullYear( now.getFullYear() );
                end.setMonth( now.getMonth() );
                end.setDate( now.getDate() );
                return ( start<=now ) && ( now<=end ) && (cms.get_medium_url( rsc ));
            } else {
                return false;
            }
        });
        return clbk && clbk( err, announces.map( function( rsc ){
            return cms.get_medium_url( rsc );
        }));
    });
}

function can_collect_input( cause_resource ) {
    return cause_resource.collect_input === 'true';
}

function can_record_message( cause_resource ) {
    return cause_resource.record_message === 'true';
}

function submit_new_event( bid, callerId, fileName, title, clbk ) {
    cms.upload( fs.createReadStream( fileName ), { title: title}, function( err, rsc ) {
        if( err ) return clbk && clbk( err );
        cms.api( "atm/event", { data: {
            method: "new_message",
            branchId: bid,
            callerId: callerId,
            messageId: rsc.rsc_id
        }}, function( err, resp ){
            return clbk && clbk( err, resp );
        });
    });
}

function upload_input_and_update_event( eid, callerId, collected_dtmf, title, clbk ){
    cms.api( "atm/resource", { data: {
        caller_input: collected_dtmf,
        caller_id: callerId,
        title: title
    }}, function( err, rsc ) {
        if( err ) return clbk && clbk( err );
        cms.api( "atm/event", { data: {
            method: "update",
            id: eid,
            cause_media_id: rsc.rsc_id
        }}, function( err, resp ){
            return clbk && clbk( err, resp );
        });
    });
}

function list_failures_by_branch( b_id, clbk ) {
    cms.api( "atm/event", {params:{ branch: b_id}}, function( err, list ) {
        if( list.events == "" ) {
            list.events = [];
        }
        clbk && clbk( err, list );
    });
}

function list_of_atms_in_branch( ){
    require( "./../atm").atms_of_branch( "4057", function(err, atms){
        console.log( err, atms );
    });
}

/*require( "./atm" ).mojoodi( "0054", function( err, result ){
    console.log( err, result );
});*/



cms.api( "atm/branch", { params: {
    branch: "4057"
}}, function( err, branch ){
    console.log( err, branch );
    cms.api( "atm/resource", { data: {
        id: branch.rsc_id,
        password: "0808"
    }, auth: true }, function( err, resp ) {
        console.log( err, resp );
    });
});
