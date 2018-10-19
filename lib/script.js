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
  
  
  // 更加每个事件的业务步骤类型做不同的判断
  
  var bizStep=tx.epcis.bizStep;
  switch (bizStep)
{
    // 如果是发货业务，更加货物数量减少发货方库存，设置状态为2（待确认），增加收货方库存数量，设置状态为2（待确认）
  case 'shipping' :
  		// console.log('Received at: ' + oldValue); 
 //实现对epcClass事件的处理
  var epcClassTracking = await getAssetRegistry('org.gs1cn.epcClassTracking');
  //await shipmentRegistry.update(shipment);
  // 读取事件关联的资产，提取批次数量并循环处理
   for ( i=0;i<tx.epcis.quantityList.length;i++){
     // 读取第一个批次数量记录
     var value=tx.epcis.quantityList[i];
     
     // 发货前应先自行创建库存，库存标识有GLN和批次数量记录构成
     // 组合发货方GLN和批次数量记录构成库存标识
     var sourceAssetid = tx.epcis.source.GLN+'_'+value.epcClass.epcClass;
     // 组合收货方GLN和批次数量记录构成库存标识
     var destinationAssetid = tx.epcis.destination.GLN+'_'+value.epcClass.epcClass;
    
    // var loanToUpdate;
    // update the state of the shipment
    
    //console.log(assetid);
    //检测发货方是否有库存
    var result=await epcClassTracking.exists(sourceassetid);
    if (result){
     // console.log('yes');
      var et= await epcClassTracking.get(sourceassetid);
      // 如果发货数量大于库存数量
      if (et.quantityElement.quantity >=value.quantity){
        // 减少库存
      	et.quantityElement.quantity -= value.quantity;
        // 状态为待确认
        et.status=2;
        // 更新内容
        await epcClassTracking.update(et);
      
      }
      else
      {
        console.log('存储货物数量必须大于发货数量'); 
      }
      
    }
     else
     {
       	console.log('需要创建库存资产');
     }
     
     
    // 处理接收方库存
    return getAssetRegistry('org.gs1cn.epcClassTracking')
    	.then(function (assetRegistry) {
  		// 检测库存是否存在
        return assetRegistry.exists(destinationAssetid);
		})
  		.then (function (exists) {
    		// 如果存在库存记录，读取库存
        	 if (exists) {
             	//console.log('Vehicle exists');
                 return getAssetRegistry('org.gs1cn.epcClassTracking')                       
                    .then(function(assetRegistry2){ 
                     return assetRegistry2.get(destinationAssetid); 
                })
                .then(function(destinationInventory){
                          //更新库存值和状态           
                        destinationInventory.quantityElement.quantity += value.quantity;
                       destinationInventory.status=2;
                        return getAssetRegistry('org.gs1cn.epcClassTracking')

                })
                .then(function(assetRegistry3){
                        return assetRegistry3.update(loanToUpdate);
                })
             }
      		 else  //如果接收方库存不存在，直接创建新的库存记录
             {
             	//console.log('Vehicle not exists');
                return getAssetRegistry('org.gs1cn.epcClassTracking')
                    .then(function(assetRegistry2){
                  var factory = getFactory();
    		      var GoodsTracking = factory.newResource('org.gs1cn', 'epcClassTracking', destinationAssetid);
    			  GoodsTracking.Owner=tx.epcis.destination;
   			      GoodsTracking.quantityElement=value;
                  GoodsTracking.status=2;
                  assetRegistry2.add(GoodsTracking);
                })
                
             }
    		
   
  		})
  		.catch(function (error) {
    	// Add optional error handling here.
       		console.log(error);
  		});
        
    }
    
  		break;
    // 如果是收货业务，和发货业务数据进行匹配，匹配成功后，设置发货方库存状态为1，设置收货方库存状态为1
	case 'receiving' :
 		 //检测发货记录是否存在
       
        
        
        //更新库存记录状态
        
       // 组合发货方GLN和批次数量记录构成库存标识
     var sourceAssetid = tx.epcis.source.GLN+'_'+value.epcClass.epcClass;
     // 组合收货方GLN和批次数量记录构成库存标识
     var destinationAssetid = tx.epcis.destination.GLN+'_'+value.epcClass.epcClass;
    
    //检测发货方是否有库存
    var result=await epcClassTracking.exists(sourceassetid);
    if (result){
     // console.log('yes');
      var et= await epcClassTracking.get(sourceassetid);
     
        // 状态为确认
        et.status=1;
        // 更新内容
        await epcClassTracking.update(et);
      
    
      
    }
     else
     {
       	console.log( '发货方库存记录不存在');
     }
       //检测收货方是否有库存
    var result=await epcClassTracking.exists(destinationAssetid);
    if (result){
     // console.log('yes');
      var et= await epcClassTracking.get(destinationAssetid);
     
        // 状态为确认
        et.status=1;
        // 更新内容
        await epcClassTracking.update(et);
      
    
      
    }
     else
     {
       	console.log( '收货方库存记录不存在');
     }
 	 	break;
}
  
  
 

   
}
