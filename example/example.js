var qcClient = require('./querycache');
var co = require('co');

var qc = new qcClient();
var stmt = null;
var resultSet = null;

co( function *() {
    try {
        var startTime = new Date();
        var connected = yield qc.open("jdbc:eda-hive://your-host:8655", "login_name", "password");
        //var connected = yield qc.open("jdbc:local-oracle://your-host:8655", "login_name", "password");
        if (!connected) {
            throw new Error("not connected");
        }
        stmt = qc.createStatement();
        var sql = "select * from your_table where id > 0 limit 10";
        //var sql = "select table_name from tabs";
        var hasResultSet = yield stmt.execute(sql);
        if (!hasResultSet) {
            console.log("query affected " + stmt.updateRowCount + " rows.");
            return;
        }

        resultSet = yield stmt.getResultSet();
        if (resultSet == null) {
            console.log("query has no result set. (BUG?)");
            return;
        }

        console.log(resultSet.columns);
        var rows = 0;
        do {
            console.log("calling resultSet.next");
            var nextRowAvailable = yield resultSet.next();
            if (nextRowAvailable) {
                rows++;
                console.log("new row (" + rows + ") ----------");
                for ( var i=1; i<=resultSet.getColumnCount(); i++) {
                    var col = resultSet.getObject(i);
                    console.log( "column " + i + " : " + col);
                }

                console.log("-- row in dictionary --");
                console.log( resultSet.getRowDict() );
                console.log("-- row in array --");
                console.log( resultSet.getRowArray() );
            }
            else {
                console.log("resultSet.next returned false");
                break;
            }
        } while(true);
        console.log("Took " + ((new Date()).getTime() - startTime.getTime()) + "ms");
    } catch (e) {
        console.log("exception!! ", e);
    } finally {
        if (resultSet != null) {
            console.log("closing resultset");
            yield resultSet.close();
        }
        if (stmt != null) {
            console.log("closing statement");
            yield stmt.close();
        }
        console.log("closing qc");
        yield qc.close();
    }
    console.log("end of test");
});
