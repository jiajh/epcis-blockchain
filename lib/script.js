/**
* A transaction processor function description
* @param {org.gs1cn.captureObjectEvent} tx A human description of the parameter
* @transaction
*/
async function CaptureObjectEvent(tx) {
 // const oldValue = tx.epcis.eventID;
 // let goods=tx.epcis.quantityList[0];
 // tx.epcis.goods.quantity=9.9;
 // tx.epcis.goods.Owner=tx.epcis.destination;
  
 // console.log('Received at: ' + oldValue); 
 //实现对epcClass事件的处理
  var epcClassTracking = await getAssetRegistry('org.gs1cn.epcClassTracking');
  //await shipmentRegistry.update(shipment);
  
   for ( i=0;i<tx.epcis.quantityList.length;i++){
     var value=tx.epcis.quantityList[i];
     var sourceassetid=tx.epcis.source.GLN+'_'+value.epcClass.epcClass;
     var assetid=tx.epcis.destination.GLN+'_'+value.epcClass.epcClass;
    
     var loanToUpdate;
    // update the state of the shipment
    
    //console.log(assetid);
    //检测发货方是否有库存
    var result=await epcClassTracking.exists(sourceassetid);
    if (result){
     // console.log('yes');
      var et= await epcClassTracking.get(sourceassetid);
      if (et.quantityElement.quantity >=value.quantity){
      	et.quantityElement.quantity -= value.quantity;
        await epcClassTracking.update(et);
      
      }
      else
      {
        //throw 存储货物数量必须大于发货数量
      }
      
    }
     else
     {
       console.log('需要创建库存资产');
     }
     
     
    // 处理接收方库存
    return getAssetRegistry('org.gs1cn.epcClassTracking')
    	.then(function (assetRegistry) {
  		console.log('111');
        return assetRegistry.exists(assetid);
		})
  		.then (function (exists) {
    		// Process the the boolean result.
        	 if (exists) {
             	console.log('Vehicle exists');
                 return getAssetRegistry('org.gs1cn.epcClassTracking')                       
                    .then(function(assetRegistry2){                               
                    return assetRegistry2.get(assetid); 
                })
                .then(function(updateloan){
                        loanToUpdate = updateloan                      
                        loanToUpdate.quantityElement.quantity += value.quantity;
                        return getAssetRegistry('org.gs1cn.epcClassTracking')

                })
                .then(function(assetRegistry3){
                        return assetRegistry3.update(loanToUpdate);
                })
             }
      		 else
             {
             	console.log('Vehicle not exists');
                return getAssetRegistry('org.gs1cn.epcClassTracking')
                    .then(function(assetRegistry2){
                  var factory = getFactory();
    		      var GoodsTracking = factory.newResource('org.gs1cn', 'epcClassTracking', assetid);
    			  GoodsTracking.Owner=tx.epcis.destination;
   			      GoodsTracking.quantityElement=value;
                  assetRegistry2.add(GoodsTracking);
                })
                
             }
    		
   
  		})
  		.catch(function (error) {
    	// Add optional error handling here.
       		console.log(error);
  		});
        
    }

   
}
