const Counter=require('./../Models/counter')

exports.sequenceCounter=(serviceType, callback) =>
{
    Counter.findByIdAndUpdate({ _id: serviceType }, { $inc: { seq: 1 } }).exec((error, counter) => {
        if (error) {
            console.log("error:" + error);
            callback()
        }
        else {
            if (counter == null) {
                var data = new Counter(
                    {
                        _id: serviceType,
                        seq: 1
                    })

                data.save(function (err, result) {
                    if (err) {
                        console.log("error:" + error);
                        callback()
                    }
                    else {
                        Counter.findByIdAndUpdate({ _id: serviceType }, { $inc: { seq: 1 } }).exec((error, counter) => {
                            if (error) {
                                console.log("error:" + error);
                                callback()
                            } else {
                                callback(counter.seq)
                            }
                        });
                    }
                });
            } else {
                callback(counter.seq)
            }
        }
    });
}