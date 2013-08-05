var opxi2 = require( "opxi2node");

var ATM = module.exports = {

    atms_of_branch: function( b_id, clbk ){
        opxi2.cms.api( "atm/branch", { params: {
            branch: b_id
        }}, function( err, atms ){
            if( err ) return clbk && clbk( err );
            return clbk && clbk( null, atms );
        });
    },

    ensure_atm_by_branch: function( atm_id, clbk ) {
        opxi2.cms.api( "atm/branch", { params: {
            atm: atm_id
        }}, function( err, branch ){
            if( err ) return clbk && clbk( err, false );
            if( branch.error ) return clbk && clbk( branch, false );
            return clbk && clbk( null, branch );
        });
    },

    mojoodi: function( atm_id, clbk ) {
        var query = {
            title: "I wanna do a query on DB",
            method: "getMojoodi",
            atm_id: atm_id
        };
        var query_job = opxi2.taskq.create( opxi2.CONFIG.atm.query_job_name, query ).on( 'failed', function(){
            clbk && clbk( {error: true, message: "query job failed!"} );
        }).on( 'complete', function(){
            query_job.get( 'data', function(err, resp){
                clbk && clbk( err, resp );
            });
        }).save();
    }

};