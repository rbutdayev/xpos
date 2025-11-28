#  **TrOmnisoft v1.0.1 \- API v2.0.1** {#tromnisoft-v1.0.1---api-v2.0.1}

**Release 01.09.2024**

[**Omnisoft v1.0.1 \- API v2.0.1	1**](#tromnisoft-v1.0.1---api-v2.0.1)

[**1\. Release notes (12.04.22)	1**](#release-notes-\(12.04.22\))

[**2\. Compatibility	1**](#compatibility)

[2.1. Configuration	1](#configuration)

[2.1.1. Launch	1](#launch)

[**2.2. Internet connectivity	2**](#internet-connectivity)

[**2.3. Compatibility of “Omnicashier” with token version	2**](#compatibility-of-“omnicashier”-with-token-version)

[**3\. How to API	3**](#how-to-api)

[Request:	3](#request:)

[Response:	3](#response:)

[**4\. Cashier instructions	3**](#cashier-instructions)

[**5\. Quick start (basic commands)	5**](#quick-start-\(basic-commands\))

[**6\. Commands detailed description	17**](#commands-detailed-description)

[6.1.1. Get Info	17](#get-info)

[Get info about token and last document number	17](#get-info-about-token-and-last-document-number)

["check\_type" – 41 get info operation	17](#"check_type"-–-41-get-info-operation)

[Example:	17](#example:)

[6.1.2. Login	17](#login)

[6.1.3. Shift status	18](#shift-status)

[6.1.4. Open shift	18](#open-shift)

[6.1.5. Creating documents Input parameters:	18](#creating-documents-input-parameters:)

[6.1.6. Description of some document fields:	18](#description-of-some-document-fields:)

[6.1.8. Checking the characters used in the names of commodity items.	20](#checking-the-characters-used-in-the-names-of-commodity-items.)

[6.1.9. Advanced optional parameters:	21](#advanced-optional-parameters:)

[Examples:	21](#examples:)

[6.1.4.2. Sale:	21](#sale:)

[6.1.4.3. Rollback:	22](#rollback:)

[6.1.4.4. Money back	22](#money-back)

[6.1.4.5. Withdraw	22](#withdraw)

[6.1.4.6. Correction	22](#correction)

[6.1.4.7. Receipt copy	22](#receipt-copy)

[6.1.4.8. Response examp](#response-example)[Reprint after printing error](https://docs.google.com/document/d/1LYX4N_YmxTQflf4SFEQJo_oYy-QtifUn/edit#heading=h.3j2qqm3)[le	23](#response-example)

[6.1.10. Receipt copy	26](#receipt-copy-1)

[6.1.11. Reprint after printing error	26](#reprint-after-printing-error)

[6.1.12. X-Report	26](#x-report)

[6.1.13. Close shift & Z-Report	28](#close-shift-&-z-report)

[6.1.14. Transaction history	29](#transaction-history)

[6.1.15. Statement for the requested period	31](#statement-for-the-requested-period)

[**7\. Check creation basic situations	32**](#check-creation-basic-situations)

[7.1. Payment types	32](#payment-types)

[7.1.1. Cash	32](#cash)

[7.1.2. Cashless	33](#cashless)

[7.1.3. Credit	34](#credit)

[7.1.4. Sale with prepayment	36](#sale-with-prepayment)

[7.1.5. Bonuses	37](#bonuses)

[7.1.6. Sale with Discount	37](#sale-with-discount)

[7.1.7. Complex payment types	39](#complex-payment-types)

[7.2. Taxation of products	40](#taxation-of-products)

[7.2.1. Tax percentage	40](#tax-percentage)

[7.2.2. Products without tax	40](#products-without-tax)

[7.2.3. Products with different taxation	41](#products-with-different-taxation)

[7.2.4. Income tax	42](#income-tax)

[7.3. Credit repayment	43](#credit-repayment)

[7.4. Prepayment	45](#prepayment)

[7.5. Money back	45](#money-back-1)

[7.5.1. Moneyback of sale	45](#moneyback-of-sale)

[7.6. Rollback	49](#rollback)

[7.7. Correction	51](#correction-1)

[7.9. Tips	51](#tips)

[**8\. Documents validations	52**](#documents-validations)

[8.1. Header	52](#header)

[8.3. Money\_back	53](#money_back)

[8.5. Correction	57](#correction-2)

[10\. API error codes	61](#api-error-codes)

1. # **Release notes (12.04.22)** {#release-notes-(12.04.22)}

# 

   New features:

   * Get info request added. You can get information about token with get info request, also get last document number

     * Open & Close moneybox (cashbox) over API

     * Prepay – prepay module added

     * Credit – credit module added

     * Login – now only authorized users can operate with API

     * Shift status – return complete information about shift status and S/N of operated device

     * Print three additional fields on sale receipts such as text, numbers, greetings, customer names, barcode with any needed information.

     * Re-print check

     * Re-print after printing error

     * Internal reference can be used for tracking and validating transactions

     * Z-Report & X-Report response with all data in report over API

     * Transaction history

     * Statement for the requested period

   

   **Release notes (18.08.2023)**

   

     * The "incomingSum" field has been added to the requests to display the amount of change on the receipt.

   “incomingSum” \- The amount of cash the buyer pays. The change will be calculated automatically.

   

   **Release notes (01.09.2024)**

   

     * The new fiscal driver, which complies with the latest requirements, has been installed.

 


   2. # **Compatibility** {#compatibility}

      “Omnicashier” software’s API receive JSON requests on an HTTP socket. By default, port 8989, Ethernet interface is listened.

   1. ## **Configuration** {#configuration}

      Configure IP addresses on Ethernet network interface of the TPS575 device. API link example 192.168.1.103:8989/v2

      1. ## **Launch** {#launch}

         *Launch API from the “Omnicashier” software, at login screen **press API(or API v2) button.*** 

         On Test units default users:

         User: SuperApi Password: 123

         To obtain API grade user on Production units, please contact technical support via

         \*1711.

         

   2. # **Internet connectivity** {#internet-connectivity}

      TPS575 consumes \~ 1.5 Mb / s of network traffic for correct operation, where ½ is the initial traffic and ½ is the incoming traffic.  
      Under the condition of continuous intensive work (about 2 checks per minute) for a month, you will need up to 5GB of total traffic.

      # 

   3. # **Compatibility of “Omnicashier” with token version** {#compatibility-of-“omnicashier”-with-token-version}

		Modules "prepayment" and "credit" are available with tokens, that have firmware version higher than 2.18.0	 	

		

3. # **How to API** {#how-to-api}

   Work with the service is carried out through the exchange of JSON messages over the HTTP socket with **POST** method.  

   ## **Request:** {#request:}

   {“requestData”:

   {“tokenData”:

   {

   “parameters”: {

   “param\_1”: value\_1, “param\_2”: value\_2,

   …

   “param\_n”: value\_n, “data”: doc\_body\_json

   },

   “operationId”: “operation\_name”, “version”: 1

   }

   }

   where:

* “parameters” – array of request parameters  
* “param\_1”, “param\_2”, “param\_n” – request parametrs  
* “data” – document body, used in “createDocuments” operations  
* value\_1, value\_2, value\_n – request parameters value  
* doc\_body\_json – document data in JSON format  
* operationId – field where we indicate the operation to be performed

  * createDocument – create a check

  * getXReport – X-report generation  
* “operation\_name” – operation  
* version” – API version  
* 1 – current version of API

  ## **Response:** {#response:}

  {

  “code”: some\_code, “data”: {

  some JSON data

  },

  “message”: “some\_message”, “info”: “some\_info”

  }

  where:

* “code” – error/response code (mandatory)  
* “data” – response data in JSON format (optional)  
* “message” – response message (optional)  
* “info” – additional information (optional)

  4. # **Cashier instructions** {#cashier-instructions}

1. **Open “Omnicashier” software, press API button on login screen, continue work from integrated software**.

   *\*If the API button is not available on the screen, please contact technical support via \+994(12)310-1711*.

   Cash Management Rules:

   * Each day begins with the opening of the shift, followed by the deposit of money into the cash drawer, the day (shift) ends with its closing and the generation of the Z-report. The shift cannot exceed 24 hours.

   * Several cashiers can work in one shift without closing it every time a new cashier arrives at the workplace.  
   


   * Cancellation check is applicable only to checks fiscalized (printed) within the current shift and is used to completely cancel a check in case of cashier error, lack of money from the buyer, etc.

   * The day ends with a shift close operation that generates a Z-report.  
   


   * In the case of prepaid operation, the deposit is issued as a prepayment. Further, as the deposit is used, the prepayment is indicated as a payment method, and upon completion of the service, depending on the return policy, a return check for the balance is issued or not issued.  
   


   * To account for income tax, you need to transfer to the Ministry of Taxes the price of the purchase of products.  
       
   * Not all cash registers have the ability to obtain the purchase price of goods necessary for the sale of products subject to taxation under the trade allowance scheme, in which case the Ministry of Taxes suggests explicitly indicating that this tax will be paid separately for the means of providing additional information to the tax authorities. For this you need in the field send “itemVatPercent” as 0, “itemMarginPrice” and “itemMarginSum” send equal “itemPrice” and “itemSum” (in field “vatAmounts” 0%).

   5. # **Quick start (basic commands)** {#quick-start-(basic-commands)}

   Response of “Login” request will contain the “access\_token” parameter, this is a session key which should be stored and used in all other operations. Also please note that parameters order should be kept within documentation. 

   *To obtain an "access token," you need to make a Login request. **The token changes if you navigate away from the API menu**, so you'll need to log in again to acquire a new "access\_token" and continue with operations.*

| Get info | {     "requestData": {         "checkData": {             "check\_type": 41         },         "access\_token": "HI01HpJe7mqPSSjl0e088A=="     } }  |
| :---- | :---- |
| Login | {     "requestData": {         "checkData": {             "check\_type": 40         },         "name": "SuperApi",         "password": "123"     } }  |
| Shift status | { “requestData”:{ “checkData”:{ “check\_type”:14 }, “access\_token”:”7dOF7HlXb/uG2J/FD+GtjA==” } } |
| Open shift | { “requestData”:{ “checkData”:{ “check\_type”:15 }, “access\_token”:”7dOF7HlXb/uG2J/FD+GtjA==” } } |
| Deposit | { “requestData”:{ “access\_token”:”7dOF7HlXb/uG2J/FD+GtjA==”, “tokenData”:{ “parameters”:{ “data”:{ “cashSum”:10.0 } } }, “checkData”:{ “check\_type”:7 } } } |
| Sale | { “requestData”:{ “access\_token”:”7dOF7HlXb/uG2J/FD+GtjA==”, “int\_ref”:”123456”, “tokenData”:{ “parameters”:{ “doc\_type”:”sale”,          "prev\_doc\_number": 1209, //optional field  “data”:{ “cashier”:”Mask”, “currency”:”AZN”, “items”:\[ { “itemName”:”Shirt”, “itemCodeType”:1, “itemCode”:”15648546”, “itemQuantityType”:0, “itemQuantity”:2.0, “itemPrice”:50.0, “itemSum”:100.0, “itemVatPercent”:18.0, “discount”:0.0 }, { “itemName”:”Trousers”, “itemCodeType”:2, “itemCode”:”1894981988122”, “itemQuantityType”:0, “itemQuantity”:1.0, “itemPrice”:100.0, “itemSum”:100.0, “itemVatPercent”:18.0, “discount”:0.0 } \], “sum”:200.0, “cashSum”:100.0, “cashlessSum”:100.0, “prepaymentSum”:0.0, “creditSum”:0.0, “bonusSum”:0.0,  “incomingSum”:100.0, “vatAmounts”:\[ { “vatSum”:200.0, “vatPercent”:18.0 } \] } }, “operationId”:”createDocument”, “version”:1 }, “checkData”:{ “check\_type”:1 } }, “receiptDetails”:\[ { “t”:0, “k”:””, “v”:”Please keep this receipt” }, { “t”:1, “k”:”Number”, “v”:”new number” }, { “t”:2, “k”:”Number”, “v”:”5258645” } \] } |
| Reprint after printing error | { “requestData”:{ “checkData”:{ “check\_type”:16 }, “access\_token”:”7dOF7HlXb/uG2J/FD+GtjA==” } } |
| Rollback | { “requestData”:{ “access\_token”:”7dOF7HlXb/uG2J/FD+GtjA==”, “checkData”:{ “check\_type”:10 }, “fiscalId”:”9mcZobUYvqnnsmxxF1JpTg9uNkCgT6na6Q833SQiBLBh” } } |
| Moneyback | { “requestData”:{ “access\_token”:”7dOF7HlXb/uG2J/FD+GtjA==”,     “tokenData”:{ “operationId”:”createDocument”, “parameters”:{             "prev\_doc\_number": 1209, //optional field  “data”:{ “bonusSum”:0.0, “cashSum”:0.0, “cashier”:”fad”, “cashlessSum”:25.0, “creditSum”:0.0, “currency”:”AZN”, “incomingSum”: 0.0, “items”:\[ { “discount”:0.0, “itemCode”:”225555”, “itemCodeType”:0, “itemName”:”test”, “itemPrice”:25.0, “itemQuantity”:1.0, “itemQuantityType”:0, “itemSum”:25.0, “itemVatPercent”:18.0 } \], “lastOperationAtUtc”:””, “parentDocument”:”63YNLNiaWkFS9Q7XxwEY4fD25LiMEU2eE6xtoAPXXDju”, “prepaymentSum”:0.0, “refund\_document\_number”:”1”, “refund\_short\_document\_id”:”63YNLNiaWkFS”, “sum”:25.0, “vatAmounts”:\[ { “vatPercent”:18.0, “vatSum”:25.0 } \] }, “doc\_type”:”money\_back” }, “version”:1 }, “checkData”:{ “check\_type”:100 } } } |
| Withdraw | { “requestData”:{ “access\_token”:”7dOF7HlXb/uG2J/FD+GtjA==”, “tokenData”:{ “parameters”:{ “data”:{ “cashSum”:10.0 } } }, “checkData”:{ “check\_type”:8 } }} |
| Correction | { “requestData”:{ “access\_token”:”7dOF7HlXb/uG2J/FD+GtjA==”, “tokenData”:{ “parameters”:{            "prev\_doc\_number": 1209, //optional field  “doc\_type”:”correction”, “data”:{ “cashier”:”Masha”, “firstOperationAtUtc”:”2020-01-07T08:00:00Z”, “lastOperationAtUtc”:”2020-01-08T14:00:00Z”, “currency”:”AZN”, “sum”:100.0, “cashSum”:50.0, “cashlessSum”:50.0, “prepaymentSum”:0.0, “creditSum”:0.0, “bonusSum”:0.0, “vatAmounts”:\[ { “vatSum”:100.0, “vatPercent”:18.0 } \] } }, “operationId”:”createDocument”, “version”:1 }, “checkData”:{ “check\_type”:19 } } } |
| Receipt copy | { “requestData”:{ “access\_token”:”7dOF7HlXb/uG2J/FD+GtjA==”, “checkData”:{ “check\_type”:11 }, “fiscalId”:”9mcZobUYvqnnsmxxF1JpTg9uNkCgT6na6Q833SQiBLBh” } } |
| X-Report | { “requestData”:{ “access\_token”:”7dOF7HlXb/uG2J/FD+GtjA==”, “checkData”:{ “check\_type”:12 } } } |
| Close shift & Z-Report | { “requestData”:{ “access\_token”:”7dOF7HlXb/uG2J/FD+GtjA==”, “checkData”:{ “check\_type”:13 } } } |

| Transaction history | { “requestData”:{ “access\_token”:”7dOF7HlXb/uG2J/FD+GtjA==”, “date\_start”:”2021-01-09 00:35:00”, “date\_end”:”2021-01-09 00:45:00”, “checkData”:{ “check\_type”:17 } } } |
| :---- | :---- |
| Statement for the requested period | {     “requestData”: {         “access\_token”: “7dOF7HlXb/uG2J/FD+GtjA==”,          “date\_start”: “2021-02-01 00:00:00”,         “date\_end”: “2021-02-19 11:00:00”,         “checkData”: {             “check\_type”: 18         }     } } |
| Credit sale | {     "requestData": {         "access\_token": "r4q+GSuah8E5GDJOEndTJg==",         "tokenData": {             "parameters": {                 "doc\_type": "sale",                 "prev\_doc\_number": 1209, //optional field                 "data": {                     "cashier": "Superman",                     "currency": "AZN",                     "creditContract": "kreditcontract123456",                     "items": \[                         {                             "itemName": "Reytuzy men, OOO GomelDrev",                             "itemCodeType": 1,                             "itemCode": "1894981988",                             "itemQuantityType": 0,                             "itemQuantity": 1,                             "itemPrice": 100,                             "itemSum": 100,                             "itemVatPercent": 18,                             "itemMarginPrice": null,                             "itemMarginSum": null                         }                     \],                     "sum": 0,                     "cashSum": 0,                     "cashlessSum": 0,                     "prepaymentSum": 0,                     "creditSum": 100,                     "bonusSum": 0,                     "incomingSum":0.0,                     "vatAmounts": \[                         {                             "vatSum": 0,                             "vatPercent": 18                         }                     \]                 }             },             "operationId": "createDocument",             "version": 1         },         "checkData": {             "check\_type": 1         }     } }  |
| Credit pay | {     "requestData": {         "access\_token": "r4q+GSuah8E5GDJOEndTJg==",         "tokenData": {             "parameters": {                 "doc\_type": "creditpay",                 "prev\_doc\_number": 1209, //optional field                 "data": {                     "cashier": "Masha",                     "currency": "AZN",                     "parentDocument": "HXn6U3hRJUz9iTuejMiWhmRMrSLcWeYpi2Cafk3gBqkM",                     "creditContract": "kreditcontract123456",                     "paymentNumber": 1,                     "items": \[                         {                             "itemName": "Reytuzy men, OOO GomelDrev",                             "itemCodeType": 5,                             "itemCode": "1564854651",                             "itemQuantityType": 0,                             "itemQuantity": 1,                             "itemPrice": 100,                             "itemSum": 100,                             "itemVatPercent": 18                         }                     \],                     "residue": 50,                     "sum": 50,                     "cashSum": 0,                     "cashlessSum": 50,                     "prepaymentSum": 0,                     "creditSum": 0,                     "bonusSum": 0,        “incomingSum”: 0.0,                     "vatAmounts": \[                         {                             "vatSum": 50,                             "vatPercent": 18                         }                     \]                 }             },             "operationId": "createDocument",             "version": 1         },         "checkData": {             "check\_type": 31         }     } } |
| CreditPay rollback | {     "requestData": {         "access\_token": "{{access\_token}}",         "tokenData": {             "parameters": {                            "doc\_type": "rollback",                 "data": {                     "cashier": "Givi",                     "currency": "AZN",                     "parentDocument": "7npC1DqpFMpSFPMGfwzG3Z5uLKYxPyoGC2CEm2z5bvmF",                     "sum": 100.00,                     "cashSum": 50.00,                     "cashlessSum": 50.00,                     "prepaymentSum": 0,                     "creditSum": 0,                     "bonusSum": 0,                     "items": \[                         {                             "itemName": "Samsung TV 55 inch",                             "itemCodeType": 1,                             "itemCode": "1894981988",                             "itemQuantityType": 0,                             "itemQuantity": 1,                             "itemPrice": 1000.00,                             "itemSum": 1000.00,                             "itemVatPercent": 18,                             "itemMarginPrice": null,                             "itemMarginSum": null                         }                     \],                     "vatAmounts": \[                         {                             "vatSum": 100,                             "vatPercent": 18                         }                     \]                 }             },             "operationId": "createDocument",             "version": 1         },         "checkData": {             "check\_type": 32         }     } }    |
| CreditSale& Sale with prepay Rollback | {     "requestData": {         "access\_token": "{{access\_token}}",         "tokenData": {             "parameters": {                            "doc\_type": "rollback",                 "data": {                     "cashier": "Givi",                     "currency": "AZN",                     "parentDocument": "CxaYWzkcQQrmVjc4qJ4zJi5Xgsna9R1Pk7AyEeZo44AK",                    "sum": 0,                     "cashSum": 0,                     "cashlessSum": 0,                     "prepaymentSum": 1000.00, // if Sale with prepay else 0                     "creditSum": 1000.00, //if creditSale else 0                     "bonusSum": 0,                     "items": \[                        {                             "itemName": "Samsung TV 55 inch",                             "itemCodeType": 1,                             "itemCode": "1894981988",                             "itemQuantityType": 0,                             "itemQuantity": 1,                             "itemPrice": 1000.00,                             "itemSum": 1000.00,                             "itemVatPercent": 18,                             "itemMarginPrice": null,                             "itemMarginSum": null                         }                     \],                     "vatAmounts": \[                         {                             "vatSum": 0,                             "vatPercent": 18                         }                     \]                 }             },             "operationId": "createDocument",             "version": 1         },         "checkData": {             "check\_type": 32         }     } }  |
| Credit pay moneyback | {     "requestData": {         "access\_token": "SIBri9MfQin1dQ0bz53tMA==",         "tokenData": {             "operationId": "createDocument",             "parameters": {                 "prev\_doc\_number": 1220,                 "data": {                     "bonusSum": 0,                     "cashSum": 10,                     "cashier": "Superman",                     "cashlessSum": 0,                     "creditSum": 0,                     "currency": "AZN",                     "items": \[                         {                             "itemName": "Reytuzy men, OOO GomelDrev",                             "itemCodeType": 1,                             "itemCode": "1894981988",                             "itemQuantityType": 0,                             "itemQuantity": 1,                             "itemPrice": 100,                             "itemSum": 100,                             "itemVatPercent": 18,                             "itemMarginPrice": null,                             "itemMarginSum": null                         }                     \],                     "lastOperationAtUtc": "",                     "parentDocument": "69qHZoApyNYzs1mY9cBtXhTSxEfqyzksR6jfiXB9dzB4",                     "moneyBackType":7,                     "prepaymentSum": 0,                     "refund\_document\_number": "1219",                     "refund\_short\_document\_id": "69qHZoApyNYz",                     "sum": 10,                     "vatAmounts": \[                         {                             "vatPercent": 18,                             "vatSum": 10                         }                     \]                 },                 "doc\_type": "money\_back"             },             "version": 1         },         "checkData": {             "check\_type": 100         }     } }  |
| Prepay | {     "requestData": {         "access\_token": "8FTwG3WeLob6RfE69+RnxQ==",         "tokenData": {             "parameters": {                 "doc\_type": "prepay",                 "prev\_doc\_number": 1209, //optional field                 "data": {                     "cashier": "Mask",                     "currency": "AZN",                     "items": \[                                              {                             "itemName": "Gift card",                             "itemCodeType": 1,                             "itemCode": "1894981988",                             "itemQuantityType": 0,                             "itemQuantity": 1.0,                             "itemPrice": 300.0,                             “itemSum”: 300.0,                             “itemVatPercent”: 18.0                         }                     \],                     “sum”: 300,                     “cashSum”: 100,                     “cashlessSum”: 100,                     “bonusSum”: 100.0,                     “creditSum”:0,        “incomingSum”: 100.0,                     “vatAmounts”: \[                         {                             “vatSum”: 300.0,                             “vatPercent”: 18.0                         }                     \]                 }             },             “operationId”: “createDocument”,             “version”: 1         },         “checkData”: {             “check\_type”: 34         }     } }  |
| Sale with prepay | {     "requestData": {         "access\_token": "zGv/auFpM6IMkTHTi9ASog==",         "tokenData": {             "parameters": {                 "doc\_type": "sale",                 "prev\_doc\_number": 1209, //optional field                 "data": {                     "cashier": "Mask",                     "currency": "AZN",                     "parents": \["69qHZoApyNYzs1mY9cBtXhTSxEfqyzksR6jfiXB9dzB4"\],                     "items": \[                         {                             "itemName": "Shirt",                             "itemCodeType": 1,                             "itemCode": "1564854651",                             "itemQuantityType": 0,                             "itemQuantity": 1.0,                             "itemPrice": 100.0,                             "itemSum": 100.0,                             "itemVatPercent": 18.0,                             "discount": 0.0                         }                     \],                     "sum": 0.0,                     "cashSum":0.0,                     "cashlessSum": 0.0,                     "prepaymentSum": 100.0,                     "creditSum": 0.0,                     "bonusSum": 0.0,        “incomingSum”: 0.0,                     "vatAmounts": \[                         {                             "vatSum": 0.0,                             "vatPercent": 18.0                         }                     \]                 }             },             "operationId": "createDocument",             "version": 1         },         "checkData": {             "check\_type": 1         }     } }  |
| Prepay Rollback | {     "requestData": {         "access\_token": "SIbPXdT12Q+swMj7MEMHOA==",         "checkData": {             "check\_type": 10         },         "fiscalId": "FtSdn5LNoXMjVuWB1i9yx79mwEF2zgatTmaoJRiDAHNZ"     } }  |
| Prepay Moneyback | { “requestData”:      { “access\_token”:”7dOF7HlXb/uG2J/FD+GtjA==”,          “tokenData”:{ “operationId”:”createDocument”, “parameters”:{            "prev\_doc\_number": 1209, //optional field “data”:{ “bonusSum”:0.0, “cashSum”:0.0, “cashier”:”fad”, “cashlessSum”:25.0, “creditSum”:0.0, “currency”:”AZN”, “items”:\[ { “discount”:0.0, “itemCode”:”225555”, “itemCodeType”:0, “itemName”:”test”, “itemPrice”:25.0, “itemQuantity”:1.0, “itemQuantityType”:0, “itemSum”:25.0, “itemVatPercent”:18.0 } \], “lastOperationAtUtc”:””, “parentDocument”:”63YNLNiaWkFS9Q7XxwEY4fD25LiMEU2eE6xtoAPXXDju”, “prepaymentSum”:0.0, “refund\_document\_number”:”1”, “refund\_short\_document\_id”:”63YNLNiaWkFS”, “sum”:25.0, “vatAmounts”:\[ { “vatPercent”:18.0, “vatSum”:25.0 } \] }, “doc\_type”:”money\_back” }, “version”:1 }, “checkData”:{ “check\_type”:100 } } } |
| MoneyBack of prepay residue | {     "requestData": {         "access\_token": "59DStq9Iis14WAdbXUAQFA==",         "tokenData": {             "operationId": "createDocument",             "parameters": {             "prev\_doc\_number": 1209, //optional field                 "data": {                     "sum": 200.0,                     "cashSum": 100.0,                     "cashlessSum": 100.0,                     "bonusSum": 0.0,                     "cashier": "fad",                     "creditSum": 0.0,                     "currency": "AZN",                     "moneyBackType": 6,                     "firstOperationAtUtc": "",                     "items": \[                         {                             "itemName": "Podarocniy sertifikat",                             "itemCodeType": 1,                             "itemCode": "1564854651",                             "itemQuantityType": 0,                             "itemQuantity": 1.0,                             "itemPrice": 300.0,                             "itemSum": 300.0,                             "itemVatPercent": 18.0,                             "discount": 0.0                         }                     \],                     "lastOperationAtUtc": "",                     "parentDocument": "9KxKAqMbN7yZnfMsPxKjoboUvuzERbFnZqkTwrmg2B17",                     "prepaymentSum": 0.0,                     "refund\_document\_number": "1",                     "refund\_short\_document\_id": "9KxKAqMbN7yZ",                     "vatAmounts": \[                         {                             "vatSum": 200.0,                             "vatPercent": 18.0                         }                     \]                 },                 "doc\_type": "money\_back"             },             "version": 1         },         "checkData": {             "check\_type": 100         }     } }  |
| Prepay with multiple items | {     "requestData": {         "access\_token": "{{access\_token}}",         "tokenData": {             "parameters": {                 "doc\_type": "prepay",                 "data": {                     "cashier": "Mask",                     "currency": "AZN",                     "items": \[                         {                             "itemName": "Monitor",                             "itemCodeType": 0,                             "itemCode": "1564854651",                             "itemQuantityType": 0,                             "itemQuantity": 1.0,                             "itemPrice": 100.0,                             "itemSum": 100.0,                             "itemVatPercent": 18.0,                             "discount": 0.0                         },                         {                             "itemName": "HDD storage",                             "itemCodeType": 0,                             "itemCode": "15648234651",                             "itemQuantityType": 0,                             "itemQuantity": 1.0,                             "itemPrice": 100.0,                             "itemSum": 100.0,                             "itemVatPercent": 18.0,                             "discount": 0.0                         },                         {                             "itemName": "Cooler",                             "itemCodeType": 0,                             "itemCode": "1564854651",                             "itemQuantityType": 0,                             "itemQuantity": 1.0,                             "itemPrice": 100.0,                             "itemSum": 100.0,                             "itemVatPercent": 18.0,                             "discount": 0.0                         }                     \],                     "sum": 100.0,                     "cashSum": 100.0,                     "cashlessSum": 0.0,                     "prepaymentSum": 0.0,                     "creditSum": 0.0,                     "bonusSum": 0.0,        “incomingSum”: 100.0,                     "vatAmounts": \[                         {                             "vatSum": 100.0,                             "vatPercent": 18.0                         }                     \]                 }             },             "operationId": "createDocument",             "version": 1         },         "checkData": {             "check\_type": 34         }     } }  |
| MoneyBack of prepay with multiple items | {     "requestData": {         "access\_token": "{{access\_token}}",         "tokenData": {             "operationId": "createDocument",             "parameters": {                 "data": {                     "sum":100.0,                     "cashSum": 100.0,                     "cashlessSum": 0.0,                     "bonusSum": 0.0,                     "cashier": "fad",                     "moneyBackType":6,                     "creditSum": 0.0,                     "currency": "AZN",                     "firstOperationAtUtc": "",                     "items": \[                         {                             "itemName": "Monitor",                             "itemCodeType": 0,                             "itemCode": "1564854651",                             "itemQuantityType": 0,                             "itemQuantity": 1.0,                             "itemPrice": 100.0,                             "itemSum": 100.0,                             "itemVatPercent": 18.0,                             "discount": 0.0                         },                         {                             "itemName": "HDD storage",                             "itemCodeType": 0,                             "itemCode": "15648234651",                             "itemQuantityType": 0,                             "itemQuantity": 1.0,                             "itemPrice": 100.0,                             "itemSum": 100.0,                             "itemVatPercent": 18.0,                             "discount": 0.0                         },                         {                             "itemName": "Cooler",                             "itemCodeType": 0,                             "itemCode": "1564854651",                             "itemQuantityType": 0,                             "itemQuantity": 1.0,                             "itemPrice": 100.0,                             "itemSum": 100.0,                             "itemVatPercent": 18.0,                             "discount": 0.0                         }                     \],                     "lastOperationAtUtc": "",                     "parentDocument": "9x4eDAw9wYMhSeNhozeFqmeW7Sf5tceAPAySfPs7Avop",                     "prepaymentSum": 0.0,                     "refund\_document\_number": "3288",                     "refund\_short\_document\_id": "9x4eDAw9wYMh",                     "vatAmounts": \[                         {                             "vatSum": 100.0,                             "vatPercent": 18.0                         }                     \]                 },                 "doc\_type": "money\_back"             },             "version": 1         },         "checkData": {             "check\_type": 100         }     } }  |
| Open money box (Cashbox) | {    "requestData":         {          "access\_token": "{{atoken}}"          "checkData":             {              "check\_type":28            }        } } |
| Close money box (Cashbox) | {   "requestData":        {        "access\_token": "{{atoken}}"         "checkData":             {              "check\_type":29            }       } } |

6. # **Commands detailed description** {#commands-detailed-description}

   1. Cashier

      1. ## **Get Info**  {#get-info}

      ## 	Get info about token and last document number {#get-info-about-token-and-last-document-number}

         ##    "check\_type" – 41 get info operation {#"check_type"-–-41-get-info-operation}

         ## 

         ## Example: {#example:}

| Request | Response |
| ----- | ----- |
| {     "requestData": {         "checkData": {             "check\_type": 41         },         "access\_token": "HI01HpJe7mqPSSjl0e088A=="     } }  | {     "code": 0,     "data": {         "cashbox\_factory\_number": "2938742983741098248193",         "cashbox\_tax\_number": "test\_00234234",         "cashregister\_factory\_number": "all",         "cashregister\_model": "AGR",         "company\_name": "\\"OMNITECH\\" MƏHDUD MƏSULİYYƏTLİ CƏMİYYƏTİ",         "company\_tax\_number": "1231234",         "firmware\_version": "2.20.0",         "last\_doc\_number": 2612,         "last\_online\_time": "2022-03-09T06:40:21Z",         "not\_after": "2023-11-03T09:56:05Z",         "not\_before": "2020-11-03T09:55:35Z",         "object\_address": "Unvan",         "object\_name": "OFİS",         "object\_tax\_number": "1238198274-1231",         "qr\_code\_url": "https://monitoring.e-kassa.az/\#/index?doc=",         "state": "ACTIVE"     },     "message": "Successful operation" }  |

         ## 

      2. ## **Login** {#login}

         Authorization

         "name" – API grade account username “password” – API grade account password "check\_type" – 40 Login operation Example:

| Request | Response |
| ----- | ----- |
| { "requestData":{ "checkData":{ "check\_type":40 }, "name":"SuperApi", "password":"123" } } | { "access\_token": "7dOF7HlXb/uG2J/FD+GtjA==", "code": 1, "message": "login success" } |

      3. ## **Shift status** {#shift-status}

         Shift and unit information

         "check\_type" – 14 Shift status operation

         "access\_token" – Session key generated during login operation 

         Example:

| Request | Response |
| ----- | ----- |
| { "requestData":{ "checkData":{ "check\_type":14 }, "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==" } } | { "code": 0, "desc": "shift is close", "message": "Successful operation", "serial": "2001G57500300007", "shiftStatus": false, "shift\_open\_time": "" } |

4. ## **Open shift** {#open-shift}

   Open fiscal shift

   "check\_type" – 15 Open shift operation

   "access\_token" – Session key generated during login operation Example:

| Request | Response |
| ----- | ----- |
| { "requestData":{ "checkData":{ "check\_type":15 }, "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==" } } | { "code":0, "message":"Successful operation" } |

   5. ## **Creating documents Input parameters:** {#creating-documents-input-parameters:}

## 

      "access\_token" \- (mandatory)

      "check\_type" – (mandatory), each operation in “Omnicashier” API, has it unique

      - 7 – Deposit  
        - 1 – Sale  
        - 16 – Re-print after printing error

        - 10 – Rollback  
        - 100 – Money back

        - 8 – Withdraw  
        - 19 – Correction  
        - 31- Credit Pay  
        - 32 – Credit Rollback  
        - 100 – Credit Moneyback  
        - 34 – Prepay 

        "doc\_type” \- (mandatory), determines the type of document, depending on this parameter, the systems will check the structure of the document for compliance with the requirements

      6. ## **Description of some document fields:** {#description-of-some-document-fields:}

      7.   
         “itemCodeType” \- type of product code, affects the interpretation of the value in the field “itemCode”, the following types are possible:  
         - 0 \- plain text \- arbitrary value  
         - 1 \- EAN8 \- barcode EAN8

         - 2 \- EAN13 \- barcode EAN13  
         - 3 \- service \- service code  
         - 5-  credit payment

         “itemQuantity” \- quantity of products, the only field in the protocol which may have 3 digits after the decimal point

         "itemPrice" \- the final price of the products, it should already take into account all possible discounts, nominally the rule must be observed items.itemPrice \= items.sum / itemQuantity “itemQuantityType” \- products measuring units (optional)

         - 0 \- pieces  
         - 1 \- kilograms

         - 2 \- liters  
         - 3 \- meters

         - 4 \- square meters  
         - 5 \- cube meters

         “itemMarginPrice” \- the difference between the sale and purchase prices is filled in if a comprehensive tax accounting is required (for example, for agriculture) (optional)1 “itemMarginSum” \- the amount of value added in the value of the products (optional), где itemMarginSum=itemMarginPrice\*itemQuantity)

         “parentDocument” \- full (not short) fiscal identifier of the parent document, according to which the operation of return or cancellation is performed

         “sum” final amount to be paid by various payment methods, “sum” \= ∑items(“itemSum”)), and “sum” \= “cashSum”+“cashlessSum”+”bonusSum” 

         “cashSum” \- Cash payment

         “cashlessSum” \- Cashless payment “prepaymentSum” \- Bonus or gift certificate payment “creditSum” \- Credit payment

         ”bonusSum” \- Bonus payment

         “incomingSum” \- The amount of cash the buyer pays. The change will be calculated automatically. 

         “vatAmounts” \- aggregated information about all possible interest rates of VAT participating in the check, where "vatAmounts" \= select "itemVatPercent", sum("itemSum") from "items" group by "itemVatPercent", Please note that if the product is not subject to VAT and has no field "itemVatPercent", in "vatAmounts" such products will be summarized as a separate line without "vatPercent" 

         (“vatAmounts”:\[{**"vatSum":"..."**},{"vatSum":"...","vatPercent":"..."},...\])

           "payment\_type" – Payment type: 0 – Cash

1. – Cashless

2. – Bonuses  
3. – Prepayment

   5– Credit

   8. ## **Checking the characters used in the names of commodity items.** {#checking-the-characters-used-in-the-names-of-commodity-items.}

      The following symbols may be used in product names:

      0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюяҒӘЈҜӨҮҺҸÇƏĞIİÖŞÜЎғәјҝөүһҹçəğıİöşüў\!@\#$%^&\*()\_-+=/,.\<\>\`\~.

{"requestData":{"access\_token":"AZcesC5rvTkPYWeSyRBc1g==","tokenData":{"parameters":{"doc\_type":"sale","data":{"cashier":"Cashier","currency":"AZN","items":\[{"itemName":"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz\!@\#$%^&\*()\_-+=/,.\<\>\`\~","itemCodeType":1,"itemCode":"10526589200147","itemQuantityType":0,"itemQuantity":1,"itemPrice":1000,"itemSum":1000,"itemVatPercent":18,"discount":0}\],"sum":1000,"cashSum":0,"cashlessSum":1000,"prepaymentSum":0,"creditSum":0,"bonusSum":0,"vatAmounts":\[{"vatSum":1000,"vatPercent":18}\]}},"operationId":"createDocument","version":1},"checkData":{"check\_type":1}}}

To use specific letters of the Azerbaijani alphabet and letters of the Russian alphabet, the encoding format must be UTF-8.  
In Postman it can be  implemented as below:

![][image1]

{"requestData":{"access\_token":"AZcesC5rvTkPYWeSyRBc1g==","tokenData":{"parameters":{"doc\_type":"sale","data":{"cashier":"Cashier","currency":"AZN","items":\[{"itemName":"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюяҒӘЈҜӨҮҺҸÇƏĞIİÖŞÜЎғәјҝөүһҹçəğıİöşüў\!@\#$%^&\*()\_-+=/,.\<\>\`\~","itemCodeType":1,"itemCode":"10526589200147","itemQuantityType":0,"itemQuantity":1,"itemPrice":1000,"itemSum":1000,"itemVatPercent":18,"discount":0}\],"sum":1000,"cashSum":0,"cashlessSum":1000,"prepaymentSum":0,"creditSum":0,"bonusSum":0,"vatAmounts":\[{"vatSum":1000,"vatPercent":18}\]}},"operationId":"createDocument","version":1},"checkData":{"check\_type":1}}}

9. ## **Advanced optional parameters:** {#advanced-optional-parameters:}

   Internal Reference:

   "int\_ref" – (optional) This parameter used if you need to track and verify request custom transaction ID, received from integrated software. Results will be available due Transaction history operation. All transactions will have parameter "int\_ref" with your values.

   Additional printing fields:

   *\*Maximal count of fields per receipt equal four. Only one barcode can be printed at the time. All other types of fields can be printed in total up to three times with different data*

   “t” – Type:

   0 – Raw data (with this parameter “k” – always should be blank "k":"" ) 1 – “k” data will be printed on left side as a key description.

   2 – Barcode (with this parameter “k” as numbers, numbers coded in barcode will be also printed under barcode)

   3 – Qr-code (with this parameter “k” – always should be blank "k":"", value of “v” will be generated to qr-code)

   “k” – This parameter used as a description printed field when "t" parameter equal 1 “v” – Values, can be any values. If parameter "t" set as 2, the data on receipt will be

   represented as a barcode.

   ## **Examples:** {#examples:}

   1. **Deposit:**  
      Cash deposit receipt.

      {"requestData":{"access\_token":"7dOF7HlXb/uG2J/FD+GtjA==","tokenData":{"par ameters":{"data":{"cashSum":10.0}}},"checkData":{"check\_type":7}}}

      2. ## **Sale**: {#sale:}

         Sale receipt.

         {"requestData":{"access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "int\_ref":"123456", "tokenData":{"parameters":{"doc\_type":"sale","data":{"cashier":"Mask","currency":

         "AZN","items":\[{"itemName":"Shirt","itemCodeType":1,"itemCode":"1564854651", "itemQuantityType":0,"itemQuantity":2.0,"itemPrice":50.0,"itemSum":100.0,"itemV atPercent":18.0,"discount":0.0},{"itemName":"Trousers","itemCodeType":2,"itemCo de":"1894981988","itemQuantityType":0,"itemQuantity":1.0,"itemPrice":100.0,"item Sum":100.0,"itemVatPercent":18.0,"discount":0.0}\],"sum":200.0,"cashSum":100.0,       "cashlessSum":100.0,"prepaymentSum":0.0,"creditSum":0.0,"bonusSum":0.0,"incomingSum":100.0,"vatAmounts":\[{"vatSum":200.0,"vatPercent":18.0}\]}},"operationId":"createDocument","version":1},"checkData":{"check\_type":1}},"receiptDetails":\[{"t":0,"k":"","v":"Please keep this receipt"},{"t":1,"k":"Number","v":"new

         number"},{"t":2,"k":"Number","v":"5258645"}\]}

         3. ## **Rollback:** {#rollback:}

            Receipt of cancellation of sales check in the framework of the current open fiscal shift. Request should contain the “long\_id” of sale receipt in "fiscalId" parameter.

            {"requestData":{"access\_token":"7dOF7HlXb/uG2J/FD+GtjA==","checkData":{"ch eck\_type":10},"fiscalId":"9mcZobUYvqnnsmxxF1JpTg9uNkCgT6na6Q833SQiBLB h"}}

         4. ## 	**Money back** {#money-back}

            The return receipt of the goods sold in both currently open and already closed fiscal shifts.  
            **"parentDocument"** – The **long\_id** of the original sale receipt.  
            **"refund\_document\_number"** – The number of the original sale document.  
            **"refund\_short\_document\_id"** – The **short\_id** of the original sale document.  
              
            {"requestData":{"access\_token":"7dOF7HlXb/uG2J/FD+GtjA==","tokenData":{"ope rationId":"createDocument","parameters":{"data":{"bonusSum":0.0,"cashSum":0.0," cashier":"fad","cashlessSum":25.0,"creditSum":0.0,"currency":"AZN","items":\[{"discount":0.0,"itemCode":"225555","itemCodeType":0,"itemName":"test","itemPrice":25.0,"itemQuantity":1.0,"itemQuantityType":0,"itemSum":25.0,"itemVatPercent":18.0}\],"parentDocument":"63YNLNiaWkFS9Q7XXwEY4fD25LiMEU2eE6xtoAPXXDju","prepaymentSum":0.0,"refund\_document\_number":"1","refund\_short\_document\_id":"63YNLNiaWkFS","sum":25.0,"vatAmounts":\[{"vatPercent":18.0,"vatSum":25.0}\]},"doc\_type":"money\_back"}," version":1},"checkData":{"check\_type":100}}}

         5. ## **Withdraw** {#withdraw}

            Cash withdrawal receipt.

            {"requestData":{"access\_token":"7dOF7HlXb/uG2J/FD+GtjA==","tokenData":{"par ameters":{"data":{"cashSum":10.0}}},"checkData":{"check\_type":8}}}

         6. ## **Correction** {#correction}

            Correction receipt in case of non-inclusion of information to the fiscal device.

            {"requestData":{"access\_token":"7dOF7HlXb/uG2J/FD+GtjA==","tokenData":{"par ameters":{"doc\_type":"correction","data":{"cashier":"Masha","firstOperationAtUtc": "2020-01-07T08:00:00Z","lastOperationAtUtc":"2020-01-

            08T14:00:00Z","currency":"AZN","sum":100.0,"cashSum":50.0,"cashlessSum":50.0,

            "prepaymentSum":0.0,"creditSum":0.0,"bonusSum":0.0,"vatAmounts":\[{"vatSum":1 00.0,"vatPercent":18.0}\]}},"operationId":"createDocument","version":1},"checkData ":{"check\_type":19}}}

         7. ## **Receipt copy** {#receipt-copy}

            Printing receipt copy.

            Request should contain the “long\_id” of sale receipt in "fiscalId" parameter.

            {"requestData":{"access\_token":"7dOF7HlXb/uG2J/FD+GtjA==","checkData":{"ch eck\_type":11},"fiscalId":"9mcZobUYvqnnsmxxF1JpTg9uNkCgT6na6Q833SQiBLB h"}}

         8. ## **Response example** {#response-example}

            {

            "code": 0,

            "document\_number": 27,

            "long\_id": "BX2RFjuzMF1v3j7bpSh6pnkLt4AYVXBAKnRRwmgKoqKP", "message": "Successful operation",

            "shift\_document\_number": 3, "short\_id": "BX2RFjuzMF1v"

            }

         9. **Credit sale:**  
              
            Credit sale receipt. Request should contain "creditContract" field and only one item for sale.  
              
            {"requestData":{"access\_token":"r4q+GSuah8E5GDJOEndTJg==","tokenData":{"parameters":{"doc\_type":"sale","data":{"cashier":"Superman","currency":"AZN","creditContract":"kreditcontract123456","items":\[{"itemName":"Reytuzy men, OOO GomelDrev","itemCodeType":1,"itemCode":"1894981988","itemQuantityType":0,"itemQuantity":1,"itemPrice":100,"itemSum":100,"itemVatPercent":18,"itemMarginPrice":0.0,"itemMarginSum":0.0}\],"sum":0,"cashSum":0,"cashlessSum":0,"prepaymentSum":0,"creditSum":100,"bonusSum":0,"incomingSum":0.0,"vatAmounts":\[{"vatSum":0,"vatPercent":18}\]}},"operationId":"createDocument","version":1},"checkData":{"check\_type":1}}}

	

10. **Credit pay**  
      
    Credit pay receipt. Request should contain the “long\_id” of credit sale receipt in "parentDocument" parameter, same "creditContract" from credit sale receipt, “residue” of the total credit amount and "paymentNumber" of creditpay receipt.  
      
    {"requestData":{"access\_token":"r4q+GSuah8E5GDJOEndTJg==","tokenData":{"parameters":{"doc\_type":"creditpay","data":{"cashier":"Masha","currency":"AZN","parentDocument":"HXn6U3hRJUz9iTuejMiWhmRMrSLcWeYpi2Cafk3gBqkM","creditContract":"kreditcontract123456","paymentNumber":2,"items":\[{"itemName":"Reytuzy men, OOO GomelDrev","itemCodeType":5,"itemCode":"1564854651","itemQuantityType":0,"itemQuantity":1,"itemPrice":100,"itemSum":100,"itemVatPercent":18}\],"residue":0,"incomingSum":0,"changeSum":0,"sum":50,"cashSum":0.0,"cashlessSum":50,"prepaymentSum":0,"creditSum":0,"bonusSum":0,"incomingSum":0.0,"vatAmounts":\[{"vatSum":50,"vatPercent":18}\]}},"operationId":"createDocument","version":1},"checkData":{"check\_type":31}}}

    11. **Credit pay money back**  
          
        The return receipt of the goods sold in both currently open and already closed fiscal shifts. Request should contain the “long\_id” of credit pay receipt in "parentDocument" parameter. Request should contain the "short\_id" of credit pay document in “refund\_short\_document\_id" parameter. "check\_type": should be  100 and "moneyBackType":7. ,"refund\_document\_number" should contain number of CreditPay document  
          
        {"requestData":{"access\_token":"+JMgGPshzQluDV5KdvtvgA==","tokenData":{"operationId":"createDocument","parameters":{"data":{"bonusSum":0,"cashSum":200,"cashier":"Superman","cashlessSum":0,"creditSum":0,"currency":"AZN","firstOperationAtUtc":"","moneyBackType":7,"items":\[{"itemName":"Televizor","itemCodeType":1,"itemCode":"1564854651","itemQuantityType":0,"itemQuantity":1,"itemPrice":2000,"itemSum":2000,"itemVatPercent":18}\],"parentDocument":"DPGA3tfDc3DYn8ozZY4zovM14K8S6vXmjxRyiwpJvaNr","prepaymentSum":0,"refund\_document\_number":"1154","refund\_short\_document\_id":"DPGA3tfDc3DY","sum":200,"vatAmounts":\[{"vatPercent":18,"vatSum":200}\]},"doc\_type":"money\_back"},"version":1},"checkData":{"check\_type":100}}}  
          
        12. **Credit pay rollback**  
              
            Credit pay rollback receipt. Receipt of cancellation of credit pays check in the framework of the current open fiscal shift. Request should contain the “long\_id” of credit pay receipt in "fiscalId" parameter. "check\_type" should be 32  
              
              
            {"requestData":{"access\_token":"qsWLfoSPzNtkzxIiVMhbyw==","tokenData":{"parameters":{"doc\_type":"rollback","data":{"cashier":"Givi","currency":"AZN","parentDocument":"HNCbeqVb2AFrZ6qbfpQL5unQP4fbLPyZkYWAZjYe4c4Q","sum":10,"cashSum":10,"cashlessSum":0,"prepaymentSum":0,"creditSum":0,"bonusSum":0,"items":\[{"itemName":"Reytuzy men, OOO GomelDrev","itemCodeType":1,"itemCode":"1894981988","itemQuantityType":0,"itemQuantity":1,"itemPrice":100,"itemSum":100,"itemVatPercent":18}\],"vatAmounts":\[{"vatSum":10,"vatPercent":18}\]}},"operationId":"createDocument","version":1},"checkData":{"check\_type":32}}}  
              
            13. **Prepay**  
                  
                Prepay receipt.   
                  
                {"requestData":{"access\_token":"8FTwG3WeLob6RfE69+RnxQ==","tokenData":{"parameters":{"doc\_type":"prepay","data":{"cashier":"Mask","currency":"AZN","items":\[{"itemName":"Gift card","itemCodeType":1,"itemCode":"1894981988","itemQuantityType":0,"itemQuantity":3,"itemPrice":100,"itemSum":300,"itemVatPercent":18}\],"sum":300,"cashSum":100,"cashlessSum":100,"bonusSum":100,"creditSum":0,"incomingSum":100.0,"vatAmounts":\[{"vatSum":300,"vatPercent":18}\]}},"operationId":"createDocument","version":1},"checkData":{"check\_type":34}}}  
                  
            14. **Prepay with multiple items**  
                  
                Prepay amount could be different, than total price of items.  
                  
                {"requestData":{"access\_token":"{{access\_token}}","tokenData":{"parameters":{"doc\_type":"prepay","data":{"cashier":"Mask","currency":"AZN","items":\[{"itemName":"Monitor","itemCodeType":0,"itemCode":"1564854651","itemQuantityType":0,"itemQuantity":1,"itemPrice":100,"itemSum":100,"itemVatPercent":18,"discount":0},{"itemName":"HDD storage","itemCodeType":0,"itemCode":"15648234651","itemQuantityType":0,"itemQuantity":1,"itemPrice":100,"itemSum":100,"itemVatPercent":18,"discount":0},{"itemName":"Cooler","itemCodeType":0,"itemCode":"1564854651","itemQuantityType":0,"itemQuantity":1,"itemPrice":100,"itemSum":100,"itemVatPercent":18,"discount":0}\],"sum":100,"cashSum":100,"cashlessSum":0,"prepaymentSum":0,"creditSum":0,"bonusSum":0,"incomingSum":100.0,"vatAmounts":\[{"vatSum":100,"vatPercent":18}\]}},"operationId":"createDocument","version":1},"checkData":{"check\_type":34}}}  
                  
                  
            15. **Sale with prepay.**  
                  
                Sale with prepay receipt. Request should contain the “long\_id” of prepay receipt in "parents" parameter.  
                  
                {"requestData":{"access\_token":"DjBtF0SILkc9Az5SixZAqA==","tokenData":{"parameters":{"doc\_type":"sale","data":{"cashier":"Mask","currency":"AZN","parents":\["9KxKAqMbN7yZnfMsPxKjoboUvuzERbFnZqkTwrmg2B17"\],"items":\[{"itemName":"Shirt","itemCodeType":1,"itemCode":"1564854651","itemQuantityType":0,"itemQuantity":1,"itemPrice":100,"itemSum":100,"itemVatPercent":18,"discount":0}\],"sum":0,"cashSum":0,"cashlessSum":0,"prepaymentSum":100,"creditSum":0,"bonusSum":0,"incomingSum":0.0,"vatAmounts":\[{"vatSum":0,"vatPercent":18}\]}},"operationId":"createDocument","version":1},"checkData":{"check\_type":1}}}	  
                  
            16. **MoneyBack of prepay residue.**  
                  
                MoneyBack of prepay residue receipt. Request should contain the “long\_id” of prepay receipt in "parents" parameter, "moneyBackType" should be equal to 6. Items fields should be same with prepay receipt, but “sum” and “vatSum” equal to refunded amount.  
                  
                {"requestData":{"access\_token":"59DStq9Iis14WAdbXUAQFA==","tokenData":{"operationId":"createDocument","parameters":{"data":{"sum":200,"cashSum":100,"cashlessSum":100,"bonusSum":0,"cashier":"fad","creditSum":0,"currency":"AZN","moneyBackType":6,"firstOperationAtUtc":"","items":\[{"itemName":"Podarocniy sertifikat","itemCodeType":1,"itemCode":"1564854651","itemQuantityType":0,"itemQuantity":1,"itemPrice":300,"itemSum":300,"itemVatPercent":18,"discount":0}\],"lastOperationAtUtc":"","parentDocument":"9KxKAqMbN7yZnfMsPxKjoboUvuzERbFnZqkTwrmg2B17","prepaymentSum":0,"refund\_document\_number":"1","refund\_short\_document\_id":"9KxKAqMbN7yZ","vatAmounts":\[{"vatSum":200,"vatPercent":18}\]},"doc\_type":"money\_back"},"version":1},"checkData":{"check\_type":100}}}  
                  
                  
            17. **MoneyBack of prepay with multiple items**  
                  
                Key value for current operation "moneyBackType":6, other data same with prepay receipt.  
                  
                {"requestData":{"access\_token":"{{access\_token}}","tokenData":{"operationId":"createDocument","parameters":{"data":{"sum":100,"cashSum":100,"cashlessSum":0,"bonusSum":0,"cashier":"fad","moneyBackType":6,"creditSum":0,"currency":"AZN","firstOperationAtUtc":"","items":\[{"itemName":"Monitor","itemCodeType":0,"itemCode":"1564854651","itemQuantityType":0,"itemQuantity":1,"itemPrice":100,"itemSum":100,"itemVatPercent":18,"discount":0},{"itemName":"HDD storage","itemCodeType":0,"itemCode":"15648234651","itemQuantityType":0,"itemQuantity":1,"itemPrice":100,"itemSum":100,"itemVatPercent":18,"discount":0},{"itemName":"Cooler","itemCodeType":0,"itemCode":"1564854651","itemQuantityType":0,"itemQuantity":1,"itemPrice":100,"itemSum":100,"itemVatPercent":18,"discount":0}\],"lastOperationAtUtc":"","parentDocument":"9x4eDAw9wYMhSeNhozeFqmeW7Sf5tceAPAySfPs7Avop","prepaymentSum":0,"refund\_document\_number":"3288","refund\_short\_document\_id":"9x4eDAw9wYMh","vatAmounts":\[{"vatSum":100,"vatPercent":18}\]},"doc\_type":"money\_back"},"version":1},"checkData":{"check\_type":100}}}  
                  
            18. **Open & Close the cashbox.**  
                Open and close the cashbox receipt.  
                If  “check\_type” equal 28, then cashbox will open, if “check\_type” equal 29, then will close.

                {

                  "requestData": 

                      {

                        "checkData": 

                           {

                             "check\_type":29

                           }

                      }

                }

        10. ## **Receipt copy** {#receipt-copy-1}

            Reprint any receipt’s copy. “Long\_ID” of a receipt should be presented as a “fiscalId” parameter.

            "check\_type" – 11 Receipt copy operation

            "access\_token" – Session key generated during login operation "fiscalId" – long\_id of needed document

            Example:

| Request | Response |
| :---- | :---- |
| { "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "checkData":{ "check\_type":11 }, "fiscalId":"9mcZobUYvqnnsmxxF1JpTg9uNkCgT6na6Q833SQiBLBh" } } | { "code": 0, "document\_number": 30, "long\_id": "BAV7Ux1YdeJfN6aXbybyCSqsZjD7ZEKb1FbxkM5ZdzUM", "message": "Successful operation", "shift\_document\_number": 6, "short\_id": "BAV7Ux1YdeJf" } |

        11. ## **Reprint after printing error** {#reprint-after-printing-error}

            Reprint half-printed receipt after paper renewal

            "check\_type" – 16 Reprint after printing error operation "access\_token" – Session key generated during login operation Example:

| Request | Response |
| ----- | ----- |
| { "requestData":{ "checkData":{ "check\_type":16 }, "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==" } } | { "code":0, "message":"Successful operation" } |

        12. ## **X-Report** {#x-report}

            Printing & obtaining X-Report "check\_type" – 12 X-Report operation

            "access\_token" – Session key generated during login operation Example:

| Request | Response |
| ----- | ----- |
| { "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "checkData":{ "check\_type":12 } } } | {     "\_z": 0,     "code": 0,     "data": {         "createdAtUtc": "2021-10-22T16:40:14",         "currencies": \[             {                 "correctionBonusSum": 0.0,                 "correctionCashSum": 0.0,                 "correctionCashlessSum": 0.0,                 "correctionCount": 0,                 "correctionCreditSum": 0.0,                 "correctionPrepaymentSum": 0.0,                 "correctionSum": 0.0,                 "correctionVatAmounts": \[\],                 "creditpayBonusSum": 0.0,                 "creditpayCashSum": 0.0,                 "creditpayCashlessSum": 0.0,                 "creditpayCount": 0,                 "creditpayCreditSum": 0.0,                 "creditpayPrepaymentSum": 0.0,                 "creditpaySum": 0.0,                 "creditpayVatAmounts": \[\],                 "currency": "AZN",                 "depositCount": 0,                 "depositSum": 0.0,                 "moneyBackBonusSum": 0.0,                 "moneyBackCashSum": 100.0,                 "moneyBackCashlessSum": 0.0,                 "moneyBackCount": 2,                 "moneyBackCreditSum": 2000.0,                 "moneyBackPrepaymentSum": 0.0,                 "moneyBackSum": 100.0,                 "moneyBackVatAmounts": \[                     {                         "vatPercent": 18.0,                         "vatSum": 100.0                     }                 \],                 "prepayBonusSum": 0.0,                 "prepayCashSum": 0.0,                 "prepayCashlessSum": 0.0,                 "prepayCount": 0,                 "prepayCreditSum": 0.0,                 "prepaySum": 0.0,                 "prepayVatAmounts": \[\],                 "rollbackBonusSum": 0.0,                 "rollbackCashSum": 0.0,                 "rollbackCashlessSum": 0.0,                 "rollbackCount": 0,                 "rollbackCreditSum": 0.0,                 "rollbackPrepaymentSum": 0.0,                 "rollbackSum": 0.0,                 "rollbackVatAmounts": \[\],                 "saleBonusSum": 0.0,                 "saleCashSum": 0.0,                 "saleCashlessSum": 0.0,                 "saleCount": 2.0,                 "saleCreditSum": 2000.0,                 "salePrepaymentSum": 100.0,                 "saleSum": 0.0,                 "saleVatAmounts": \[                     {                         "vatPercent": 18.0,                         "vatSum": 0.0                     }                 \],                 "withdrawCount": 0,                 "withdrawSum": 0.0             }         \],         "docCountToSend": 0,         "document\_id": "",         "firstDocNumber": 762,         "lastDocNumber": 765,         "reportNumber": 180,         "shiftOpenAtUtc": "2021-10-22T13:52:37"     },     "message": "Successful operation" } |

13. ## **Close shift & Z-Report** {#close-shift-&-z-report}

    Closing fiscal shift, printing and obtaining Z-Report

    "check\_type" – 13 Close shift & Z-Report operation

    "access\_token" – Session key generated during login operation Example:

| Request | Response |
| ----- | ----- |
| { "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "checkData":{ "check\_type":13 } } } | {     "code": 0,     "data": {         "createdAtUtc": "2021-10-22T16:47:16",         "currencies": \[             {                 "correctionBonusSum": 0.0,                 "correctionCashSum": 0.0,                 "correctionCashlessSum": 0.0,                 "correctionCount": 0,                 "correctionCreditSum": 0.0,                 "correctionPrepaymentSum": 0.0,                 "correctionSum": 0.0,                 "correctionVatAmounts": \[\],                 "creditpayBonusSum": 0.0,                 "creditpayCashSum": 0.0,                 "creditpayCashlessSum": 0.0,                 "creditpayCount": 0,                 "creditpayCreditSum": 0.0,                 "creditpayPrepaymentSum": 0.0,                 "creditpaySum": 0.0,                 "creditpayVatAmounts": \[\],                 "currency": "AZN",                 "depositCount": 0,                 "depositSum": 0.0,                 "moneyBackBonusSum": 0.0,                 "moneyBackCashSum": 100.0,                 "moneyBackCashlessSum": 0.0,                 "moneyBackCount": 2,                 "moneyBackCreditSum": 2000.0,                 "moneyBackPrepaymentSum": 0.0,                 "moneyBackSum": 100.0,                 "moneyBackVatAmounts": \[                     {                         "vatPercent": 18.0,                         "vatSum": 100.0                     }                 \],                 "prepayBonusSum": 0.0,                 "prepayCashSum": 0.0,                 "prepayCashlessSum": 0.0,                 "prepayCount": 0,                 "prepayCreditSum": 0.0,                 "prepaySum": 0.0,                 "prepayVatAmounts": \[\],                 "rollbackBonusSum": 0.0,                 "rollbackCashSum": 0.0,                 "rollbackCashlessSum": 0.0,                 "rollbackCount": 0,                 "rollbackCreditSum": 0.0,                 "rollbackPrepaymentSum": 0.0,                 "rollbackSum": 0.0,                 "rollbackVatAmounts": \[\],                 "saleBonusSum": 0.0,                 "saleCashSum": 0.0,                 "saleCashlessSum": 0.0,                 "saleCount": 2.0,                 "saleCreditSum": 2000.0,                 "salePrepaymentSum": 100.0,                 "saleSum": 0.0,                 "saleVatAmounts": \[                     {                         "vatPercent": 18.0,                         "vatSum": 0.0                     }                 \],                 "withdrawCount": 0,                 "withdrawSum": 0.0             }         \],         "docCountToSend": 0,         "document\_id": "ABzrjw5jCLvc3odRkMMQd5M7SFXpC7qXh9ZQCTRvHtDV",         "firstDocNumber": 762,         "lastDocNumber": 765,         "reportNumber": 180,         "shiftOpenAtUtc": "2021-10-22T13:52:37"     },     "message": "Successful operation" } |

    14. ## **Transaction history** {#transaction-history}

        Provides the sale transactions history for specified period. "check\_type" – 17 Transaction history operation

        "access\_token" – Session key generated during login operation Example:

| Request | Response |
| :---- | :---- |
| { "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "date\_start":"2021-01-09 00:35:00", "date\_end":"2021-01-09 00:45:00", "checkData":{ "check\_type":17 | { "code":0, "message":"success", "transactions":\[ { "additionalData":\[  \], |

| } } } | "avans\_payment":0.0, "bonus\_payment":0.0, "card\_payment":100.0, "cash\_payment":100.0, "check\_type":1, "credit\_payment":0.0, "date":"2021-01-09 00:37:13", "documentId":"", "id":356, "int\_ref":"123456", "mainCheckType":0, "operationSession":"c5368db208def11eb9a983c3dde536c3", "operationStatus":1, "payment\_discount":0, "products\_list":"\[{\\"buyPrice\\":0.00,\\"categoryId\\":-1,\\"code\\":\\"\\",\\"description\\":\\"api\\",\\"discount\\":0.00, \\"discount\_amount\\":0.00,\\"field\_temp\\":\\"\\",\\"id\\":0,\\"image\\":\\"\\",\\"item\_discount\_percent\\":0.00,\\"nds\\":18, \\"ndsSummary\\":7.6200,\\"ndsType\\":0,\\"productType\\":\\"\\",\\"quantity\\":2.0000,\\"sellPrice\\":50.0000, \\"stockCount\\":0.0,\\"stockPrice\\":0.0,\\"title\\":\\"Shirt\\",\\"unitType\\":0},{\\"buyPrice\\":0.00,\\"categoryId\\":-1, \\"code\\":\\"\\",\\"description\\":\\"api\\",\\"discount\\":0.00,\\"discount\_amount\\":0.00,\\"field\_temp\\":\\"\\",\\"id\\":0, \\"image\\":\\"\\",\\"item\_discount\_percent\\":0.00,\\"nds\\":18,\\"ndsSummary\\":15.2500,\\"ndsType\\":0, \\"productType\\":\\"\\",\\"quantity\\":1.0000,\\"sellPrice\\":100.0000,\\"stockCount\\":0.0,\\"stockPrice\\":0.0, \\"title\\":\\"Trousers\\",\\"unitType\\":0}\]", "products\_quantity":0, "receiptDetails":\[ \], "seller\_name":"Mask", "service\_type":"", "summary\_money":200.0, "token\_request":"{\\"operationId\\":\\"createDocument\\", \\"parameters\\":{\\"access\_token\\":\\"7dOF7HlXb/uG2J/FD+GtjA==\\",\\"data\\":{\\"bonusSum\\":0.00, \\"cashSum\\":100.0000,\\"cashier\\":\\"Mask\\",\\"cashlessSum\\":100.0000,\\"creditSum\\":0.00,\\"currency\\":\\"AZN\\", \\"items\\":\[{\\"discount\\":0.00,\\"itemCode\\":\\"1564854651\\",\\"itemCodeType\\":1,\\"itemName\\":\\"Shirt\\", \\"itemPrice\\":50.0000,\\"itemQuantity\\":2.0000,\\"itemQuantityType\\":0,\\"itemSum\\":100.0000, \\"itemVatPercent\\":18.0000},{\\"discount\\":0.00,\\"itemCode\\":\\"1894981988\\",\\"itemCodeType\\":2, \\"itemName\\":\\"Trousers\\",\\"itemPrice\\":100.0000,\\"itemQuantity\\":1.0000,\\"itemQuantityType\\":0, \\"itemSum\\":100.0000,\\"itemVatPercent\\":18.0000}\],\\"prepaymentSum\\":0.00,\\"sum\\":200.0000, \\"vatAmounts\\":\[{\\"vatPercent\\":18.0000,\\"vatSum\\":200.0000}\]}, \\"doc\_type\\":\\"sale\\"},\\"version\\":1}", "token\_response":"{\\"code\\":0, \\"data\\":{\\"document\_id\\":\\"33nh7xtPiivgZJikQ66DKbYCuPmMZD9E67KGMJ8uwABq\\", \\"document\_number\\":36,\\"shift\_document\_number\\":12, \\"short\_document\_id\\":\\"33nh7xtPiivg\\"},\\"message\\":\\"Successful operation\\"}", "total\_discount\_amount":0, "total\_discount\_percent":0, "transaction\_id":"33nh7xtPiivg" } \] } |
| :---- | ----- |

15. ## 	**Statement for the requested period** {#statement-for-the-requested-period}

    ## 

    Provides the all transactions history for specified period. "check\_type" – 18 Transaction history operation

    "access\_token" – Session key generated during login operation Example:

| Request | Response |
| :---- | :---- |
| {     "requestData": {  "access\_token": "7dOF7HlXb/uG2J/FD+GtjA==",          "date\_start": "2021-02-01 00:00:00",         "date\_end": "2021-02-19 11:00:00",         "checkData": {             "check\_type": 18         }     } } | {     "code": 0,     "data": {         "createdAtUtc": "2021-10-22T12:53:13Z",         "currencies": \[             {                 "correctionBonusSum": 0.0,                 "correctionCashSum": 7973.0,                 "correctionCashlessSum": 981.0,                 "correctionCount": 8,                 "correctionCreditSum": 0.0,                 "correctionPrepaymentSum": 1.0,                 "correctionSum": 8955.0,                 "correctionVatAmounts": \[                     {                         "vatPercent": 18.0,                         "vatSum": 2639.0                     },                     {                         "vatPercent": 8.0,                         "vatSum": 6316.0                     }                 \],                 "creditpayBonusSum": 290.0,                 "creditpayCashSum": 7090.0,                 "creditpayCashlessSum": 430.0,                 "creditpayCount": 64,                 "creditpayCreditSum": 0.0,                 "creditpayPrepaymentSum": 0.0,                 "creditpaySum": 7810.0,                 "creditpayVatAmounts": \[                     {                         "vatPercent": 18.0,                         "vatSum": 7810.0                     }                 \],                 "currency": "AZN",                 "depositCount": 16,                 "depositSum": 19681.8,                 "moneyBackBonusSum": 50.0,                 "moneyBackCashSum": 18782.5,                 "moneyBackCashlessSum": 2015.0,                 "moneyBackCount": 93,                 "moneyBackCreditSum": 5000.0,                 "moneyBackPrepaymentSum": 1520.0,                 "moneyBackSum": 21147.5,                 "moneyBackVatAmounts": \[                     {                         "vatPercent": 18.0,                         "vatSum": 21097.5                     },                     {                         "vatPercent": 0.0,                         "vatSum": 50.0                     }                 \],                 "prepayBonusSum": 900.0,                 "prepayCashSum": 12670.0,                 "prepayCashlessSum": 1600.0,                 "prepayCount": 41,                 "prepayCreditSum": 0.0,                 "prepaySum": 15170.0,                 "prepayVatAmounts": \[                     {                         "vatPercent": 18.0,                         "vatSum": 15170.0                     }                 \],                 "rollbackBonusSum": 11.0,                 "rollbackCashSum": 2758.85,                 "rollbackCashlessSum": 704.15,                 "rollbackCount": 31,                 "rollbackCreditSum": 0.0,                 "rollbackPrepaymentSum": 400.0,                 "rollbackSum": 3874.0,                 "rollbackVatAmounts": \[                     {                         "vatPercent": 18.0,                         "vatSum": 3852.51                     },                     {                         "vatPercent": 0.0,                         "vatSum": 1.0                     },                     {                         "vatPercent": 2.0,                         "vatSum": 18.99                     },                     {                         "vatPercent": 0.0,                         "vatSum": 1.5                     }                 \],                 "saleBonusSum": 5601.0,                 "saleCashSum": 1117117.42,                 "saleCashlessSum": 16600.33,                 "saleCount": 326.0,                 "saleCreditSum": 25102.0,                 "salePrepaymentSum": 21970.0,                 "saleSum": 1141968.75,                 "saleVatAmounts": \[                     {                         "vatPercent": 18.0,                         "vatSum": 1138031.74                     },                     {                         "vatPercent": 0.0,                         "vatSum": 1312.2                     },                     {                         "vatPercent": 2.0,                         "vatSum": 2159.99                     },                     {                         "vatPercent": 8.0,                         "vatSum": 263.3                     },                     {                         "vatPercent": 0.0,                         "vatSum": 201.5                     }                 \],                 "withdrawCount": 4,                 "withdrawSum": 440.0             }         \],         "docCountToSend": 1,         "document\_id": "",         "firstDocNumber": 179,         "lastDocNumber": 761,         "reportNumber": 181,         "shiftOpenAtUtc": "2021-02-11T05:32:10Z"     },     "message": "success" } |

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    ## 

    7. # **Check creation basic situations** {#check-creation-basic-situations}

    1. ## **Payment types** {#payment-types}

       1. ## **Cash** {#cash}

          {

          "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "int\_ref":"123456",

          "tokenData":{ "parameters":{ "doc\_type":"sale", "data":{

          "cashier":"Mask",

          "currency":"AZN", "items":\[

          {

          "itemName":"Shirt", "itemCodeType":1, "itemCode":"1564854651",

          "itemQuantityType":0, "itemQuantity":2.0, "itemPrice":40.0, "itemSum":80.0, "itemVatPercent":18.0, "discount":0.0

          },

          {

          "itemName":"Trousers", "itemCodeType":2, "itemCode":"1894981988",

          "itemQuantityType":0, "itemQuantity":1.0, "itemPrice":100.0, "itemSum":100.0, "itemVatPercent":18.0, "discount":0.0

          }

          \],

          "sum":180.0,

          "cashSum":180.0, "cashlessSum":0.0, "prepaymentSum":0.0, "creditSum":0.0,

          "bonusSum":0.0, 

          "incomingSum":200.0,

          "vatAmounts":\[

          {

          "vatSum":180.0, "vatPercent":18.0

          }

          \]

          }

          },

          "operationId":"createDocument", "version":1

          },

          "checkData":{ "check\_type":1

          }

          },

          "receiptDetails":\[

          {

          "t":0, "k":"",

          "v":"Please keep this receipt"

          },

          {

          "t":1,

          "k":"Number",

          "v":"new number"

          },

          {

          "t":2,

          "k":"Number",

          "v":"5258645"

          }

          \]

          }

        


## 

       2. ## **Cashless** {#cashless}

          {

          "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "int\_ref":"123456",

          "tokenData":{ "parameters":{ "doc\_type":"sale", "data":{

          "cashier":"Mask",

          "currency":"AZN", "items":\[

          {

          "itemName":"Shirt", "itemCodeType":1, "itemCode":"1564854651",

          "itemQuantityType":0, "itemQuantity":2.0, "itemPrice":50.0, "itemSum":100.0, "itemVatPercent":18.0, "discount":0.0

          },

          {

          "itemName":"Trousers",

          "itemCodeType":2, "itemCode":"1894981988",

          "itemQuantityType":0, "itemQuantity":1.0, "itemPrice":100.0, "itemSum":100.0, "itemVatPercent":18.0, "discount":0.0

          }

          \],

          "sum":200.0,

          "cashSum":0.0, "cashlessSum":200.0, "prepaymentSum":0.0, "creditSum":0.0,

          "bonusSum":0.0, 

          "incomingSum":0.0,

          "vatAmounts":\[

          {

          "vatSum":200.0, "vatPercent":18.0

          }

          \]

          }

          },

          "operationId":"createDocument", "version":1

          },

          "checkData":{ "check\_type":1

          }

          },

          "receiptDetails":\[

          {

          "t":0, "k":"",

          "v":"Please keep this receipt"

          },

          {

          "t":1,

          "k":"Number",

          "v":"new number"

          },

          {

          "t":2,

          "k":"Number",

          "v":"5258645"

          }

          \]

          }

       3. ## **Credit** {#credit}

          Goods sold on credit are not taxed and not indicated in the total amount (“sum”: 0 & “vatSum”: 0).  
          If payment type mixed, then  **“sum” &”vatSum” \= “cashSum \+ cashlessSum \+ bonusSum”**  
          Only one item can be sold on credit

          {

              "requestData": {

                  "access\_token": "qsWLfoSPzNtkzxIiVMhbyw==",

                  "tokenData": {

                      "parameters": {

                          "doc\_type": "sale",

                          "data": {

                              "cashier": "Superman",

                              "currency": "AZN",

                              "creditContract": " kreditcontract123456",

                              "items": \[

                                  {

                                      "itemName": "Reytuzy men, OOO GomelDrev",

                                      "itemCodeType": 1,

                                      "itemCode": "1894981988",

                                      "itemQuantityType": 0,

                                      "itemQuantity": 1,

                                      "itemPrice": 100,

                                      "itemSum": 100,

                                      "itemVatPercent": 18

                                  }

                              \],

                              "sum": 0,

                              "cashSum": 0,

                              "cashlessSum": 0,

                              "creditSum": 100,

                              "bonusSum": 0,

                     "incomingSum":0.0,

                              "vatAmounts": \[

                                  {

                                      "vatSum": 0,

                                      "vatPercent": 18

                                  }

                              \]

                          }

                      },

                      "operationId": "createDocument",

                      "version": 1

                  },

                  "checkData": {

                      "check\_type": 1

                  }

              }

          }

       

       

       

          **Sale on credit initial payment:**

          	{

              "requestData": {

                  "access\_token": "qsWLfoSPzNtkzxIiVMhbyw==",

                  "tokenData": {

                      "parameters": {

                          "doc\_type": "sale",

                          "data": {

                              "cashier": "Superman",

                              "currency": "AZN",

                              "creditContract": "kreditcontract123456",

                              "items": \[

                                  {

                                      "itemName": "Reytuzy men, OOO GomelDrev",

                                      "itemCodeType": 1,

                                      "itemCode": "1894981988",

                                      "itemQuantityType": 0,

                                      "itemQuantity": 1,

                                      "itemPrice": 1200,

                                      "itemSum": 1200,

                                      "itemVatPercent": 18

                                  }

                              \],

                              "sum": 200,

                              "cashSum": 0,

                              "cashlessSum": 200,

                              "creditSum": 1000,

                              "bonusSum": 0,

                    "incomingSum": 0.0,

                              "vatAmounts": \[

                                  {

                                      "vatSum": 200,

                                      "vatPercent": 18

                                  }

                              \]

                          }

                      },

                      "operationId": "createDocument",

                      "version": 1

                  },

                  "checkData": {

                      "check\_type": 1

                  }

              }

          }

       

       4. ## **Sale with prepayment** {#sale-with-prepayment}

          

       For current operation field “parents” should contain fiscal\_id of prepay document. “prepaymentSum” should be equal or less than amount of prepay document.

       “prepaymentSum” \<= prepay document amount. Amount paid with prepay 

       Amount paid as prepay are not taxed and not indicated in the total amount 

       (“vatSum” & “sum” \=  “cashSum” \+ “cashlessSum” \+  “bonusSum“  ).

          

          {

          "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "int\_ref":"123456",

          "tokenData":{ "parameters":{ "doc\_type":"sale", "data":{

          "cashier":"Mask",

          "currency":"AZN", 

          "parents": \["9KxKAqMbN7yZnfMsPxKjoboUvuzERbFnZqkTwrmg2B17"\],

          "items":\[

          {

          "itemName":"Shirt", "itemCodeType":1, "itemCode":"1564854651",

          "itemQuantityType":0, "itemQuantity":2.0, "itemPrice":50.0, "itemSum":100.0, "itemVatPercent":18.0, "discount":0.0

          },

          {

          "itemName":"Trousers", "itemCodeType":2, "itemCode":"1894981988",

          "itemQuantityType":0, "itemQuantity":1.0, "itemPrice":100.0, "itemSum":100.0, "itemVatPercent":18.0, "discount":0.0

          }

          \],

          "sum":150.0,

          "cashSum":150.0, "cashlessSum":0.0, "prepaymentSum":50.0, "creditSum":0.0,

          "bonusSum":0.0, 

          "incomingSum": 150.0,

          "vatAmounts":\[

          {

          "vatSum":150.0, "vatPercent":18.0

          }

          \]

          }

          },

          "operationId":"createDocument", "version":1

          },

          "checkData":{ "check\_type":1

          }

          },

          "receiptDetails":\[

          {

          "t":0, "k":"","v":"Please keep this receipt"

          },

          {

          "t":1,

          "k":"Number",

          "v":"new number"

          },

          {

          "t":2,

          "k":"Number",

          "v":"5258645"

          }

          \]

          }

       5. ## **Bonuses** {#bonuses}

          {

          "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "int\_ref":"123456",

          "tokenData":{ "parameters":{ "doc\_type":"sale", "data":{

          "cashier":"Mask",

          "currency":"AZN", "items":\[

          {

          "itemName":"Shirt", "itemCodeType":1, "itemCode":"1564854651",

          "itemQuantityType":0, "itemQuantity":2.0, "itemPrice":50.0, "itemSum":100.0, "itemVatPercent":18.0, "discount":0.0

          },

          {

          "itemName":"Trousers", "itemCodeType":2, "itemCode":"1894981988",

          "itemQuantityType":0, "itemQuantity":1.0, "itemPrice":100.0, "itemSum":100.0, "itemVatPercent":18.0, "discount":0.0

          }

          \],

          "sum":200.0,

          "cashSum":0.0, "cashlessSum":0.0, "prepaymentSum":0.0, "creditSum":0.0, "bonusSum":200.0, 

          "incomingSum": 0.0, "vatAmounts":\[

          {

          "vatSum":200.0, "vatPercent":18.0

          }

          \]

          }

          },

          "operationId":"createDocument", "version":1

          },

          "checkData":{ "check\_type":1

          }

          },

          "receiptDetails":\[

          {

          "t":0, "k":"",

          "v":"Please keep this receipt"

          },

          {

          "t":1,

          "k":"Number",

          "v":"new number"

          },

          {

          "t":2,

          "k":"Number",

          "v":"5258645"

          }

          \]

          

          

          ## 

       6. ## **Sale with Discount** {#sale-with-discount}

	  
	{  
    "requestData": {  
        "access\_token": "sNXaLGwlFOHitkWXbiMWDQ==",  
        "tokenData": {  
            "parameters": {  
                "doc\_type": "sale",  
                "data": {  
                    "cashier": "Mask",  
                    "currency": "AZN",  
                    "items": \[  
                        {  
                            "itemName": "Gürcü xəngəli",  
                            "itemCodeType": 1,  
                            "itemCode": "10526589200147",  
                            "itemQuantityType": 0,  
                            "itemQuantity": 12.0,  
                            "itemPrice": 0.7,  
                            "itemSum": 8.40,  
                            "itemVatPercent": 18.0,  
                            "discount": 0.40  
                        },  
                        {  
                            "itemName": "Nataktari 0.5l",  
                            "itemCodeType": 2,  
                            "itemCode": "18949899805",  
                            "itemQuantityType": 0,  
                            "itemQuantity": 1.0,  
                            "itemPrice": 2.0,  
                            "itemSum": 2.0,  
                            "itemVatPercent": 18.0,  
                            "discount": 0.5  
                        }  
                    \],  
                    "sum": 10.4,  
                    "cashSum": 0.0,  
                    "cashlessSum": 10.40,  
                    "prepaymentSum": 0.0,  
                    "creditSum": 0.0,  
                    "bonusSum": 0.0,  
                    "incomingSum": 0.0  
                    "vatAmounts": \[  
                        {  
                            "vatSum": 10.40,  
                            "vatPercent": 18.0  
                        }  
                    \]  
                }  
            },  
            "operationId": "createDocument",  
            "version": 1  
        },  
        "checkData": {  
            "check\_type": 1  
        }  
    }  
}

7. ## **Complex payment types** {#complex-payment-types}

   {

   "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "int\_ref":"123456",

   "tokenData":{ "parameters":{ "doc\_type":"sale", "data":{

   "cashier":"Mask",

   "currency":"AZN", "items":\[

   {

   "itemName":"Shirt", "itemCodeType":1, "itemCode":"1564854651",

   "itemQuantityType":0, "itemQuantity":2.0, "itemPrice":50.0, "itemSum":100.0, "itemVatPercent":18.0, "discount":0.0

   },

   {

   "itemName":"Trousers", "itemCodeType":2, "itemCode":"1894981988",

   "itemQuantityType":0, "itemQuantity":1.0, "itemPrice":100.0, "itemSum":100.0, "itemVatPercent":18.0, "discount":0.0

   }

   \],

   "sum":200.0,

   "cashSum":50.0, "cashlessSum":100.0, "prepaymentSum":0.0, "creditSum":0.0,

   "bonusSum":50.0, 

   "incomingSum": 50.0,

   "vatAmounts":\[

   {

   "vatSum":200.0, "vatPercent":18.0

   }

   \]

   }

   },

   "operationId":"createDocument", "version":1

   },

   "checkData":{ "check\_type":1

   }

   },

   "receiptDetails":\[

   {

   "t":0, "k":"",

   "v":"Please keep this receipt"

   },

   {

   "t":1,

   "k":"Number",

   "v":"new number"

   },

   {

   "t":2,

   "k":"Number",

   "v":"5258645"

   }

   \]

   }

   2. ## **Taxation of products** {#taxation-of-products}

      1. ## **Tax percentage** {#tax-percentage}

         Each item on sale must have information on the tax rate.

         {

         "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "int\_ref":"123456",

         "tokenData":{ "parameters":{ "doc\_type":"sale", "data":{

         "cashier":"Mask",

         "currency":"AZN", "items":\[

         {

         "itemName":"Shirt", "itemCodeType":1, "itemCode":"1564854651",

         "itemQuantityType":0, "itemQuantity":2.0, "itemPrice":50.0, "itemSum":100.0, "itemVatPercent":18.0, "discount":0.0

         },

         {

         "itemName":"Trousers", "itemCodeType":2, "itemCode":"1894981988",

         "itemQuantityType":0, "itemQuantity":1.0, "itemPrice":100.0, "itemSum":100.0, "itemVatPercent":18.0, "discount":0.0

         }

         \],

         "sum":200.0,

         "cashSum":50.0, "cashlessSum":100.0, "prepaymentSum":0.0, "creditSum":0.0,

         "bonusSum":50.0, 

         "incomingSum": 50.0

         "vatAmounts":\[

         {

         "vatSum":200.0, "vatPercent":18.0

         }

         \]

         }

         },

         "operationId":"createDocument", "version":1

         },

         "checkData":{ "check\_type":1

         }

         },

         "receiptDetails":\[

         {

         "t":0, "k":"",

         "v":"Please keep this receipt"

         },

         {

         "t":1,

         "k":"Number",

         "v":"new number"

         },

         {

         "t":2,

         "k":"Number",

         "v":"5258645"

         }

         \]

         }

      2. ## **Products without tax** {#products-without-tax}

       


         {

         "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "int\_ref":"123456",

         "tokenData":{ "parameters":{ "doc\_type":"sale", "data":{

         "cashier":"Mask",

         "currency":"AZN", "items":\[

         {

         "itemName":"Corek\_Хлеб", "itemCodeType":1, "itemCode":"1564854651",

         "itemQuantityType":0, "itemQuantity":2.0, "itemPrice":0.40, "itemSum":0.80,

         "itemVatPercent":0.0, "discount":0.0

         }

         \], "sum":0.80,

         "cashSum":0.80, "cashlessSum":0.0, "prepaymentSum":0.0, "creditSum":0.0,

         "bonusSum":0.0, 

         "incomingSum": 1.0,

         "vatAmounts":\[

         {"vatSum":0.80,

         "vatPercent":0.0

         }

         \]

         }

         },

         "operationId":"createDocument", "version":1

         },

         "checkData":{ "check\_type":1

         }

         },

         "receiptDetails":\[

         {

         "t":0, "k":"",

         "v":"Please keep this receipt"

         },

         {

         "t":1,

         "k":"Number",

         "v":"new number"

         },

         {

         "t":2,

         "k":"Number",

         "v":"5258645"

         }

         \]

         }

         

      3. ## **Products with different taxation** {#products-with-different-taxation}

         Check may contain products with different taxation.

         {

         "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "int\_ref":"123456",

         "tokenData":{ "parameters":{ "doc\_type":"sale", "data":{

         "cashier":"Mask",

         "currency":"AZN", "items":\[

         {

         "itemName":"Corek\_Хлеб", "itemCodeType":1, "itemCode":"1564854651",

         "itemQuantityType":0, "itemQuantity":2.0, "itemPrice":0.40, "itemSum":0.80,

         "itemVatPercent":0.0, "discount":0.0

         },

         {

         "itemName":"SomeDriks", "itemCodeType":2, "itemCode":"1894981988",

         "itemQuantityType":0, "itemQuantity":1.0, "itemPrice":1.20, "itemSum":1.20, "itemVatPercent":18.0, "discount":0.0

         }

         \],

         "sum":2.0,

         "cashSum":1.0, "cashlessSum":1.0, "prepaymentSum":0.0, "creditSum":0.0,

         "bonusSum":0.0, 

         "incomingSum": 1.0,

         "vatAmounts":\[

         {

         "vatSum":1.20, "vatPercent":18.0

         },

         {"vatSum":0.80,

         "vatPercent":0.0

         }

         \]

         }

         },

         "operationId":"createDocument", "version":1

         },

         "checkData":{ "check\_type":1

         }

         },

         "receiptDetails":\[

         {

         "t":0, "k":"",

         "v":"Please keep this receipt"

         },

         {

         "t":1,

         "k":"Number",

         "v":"new number"

         },

         {

         "t":2,

         "k":"Number",

         "v":"5258645"

         }

         \]

         }

         

      4. ## **Income tax** {#income-tax}

         An income tax has been introduced for some categories of products, which requires a separation of the marginal part and cost, where the marginal part is taxed in accordance with the percentage of taxation, part of the cost is not taxed.

         {

         "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "int\_ref":"123456",

         "tokenData":{ "parameters":{ "doc\_type":"sale", "data":{

         "cashier":"Givi",

         "currency":"AZN", "items":\[

         {

         "itemName":"Картошка", "itemCodeType":1, "itemCode":"15648552", "itemQuantity":2.5, "itemPrice":4.0,

         "itemSum":10.0, "itemVatPercent":18.0, "itemMarginPrice":0.5, "itemMarginSum":2.0

         }

         \],

         "sum":10.0,

         "cashSum":0.0, "cashlessSum":10.0, "prepaymentSum":0.0, "creditSum":0.0,

         "bonusSum":0.0, 

         "incomingSum": 0.0,

         "vatAmounts":\[

         {

         "vatSum":2.0, "vatPercent":18.0

         }

         }

         },

         "operationId":"createDocument", "version":1

         },

         "checkData":{ "check\_type":1

         }

         },

         "receiptDetails":\[

         {

         "t":0, "k":"",

         "v":"Please keep this receipt"

         },

         {

         "t":1,

         "k":"Number",

         "v":"new number"

         },

         {

         "t":2,

         "k":"Number",

         "v":"5258645"

         }

         \]

         }

   3. ## **Credit repayment** {#credit-repayment}

      For credit repayment check, the product type is indicated as a credit ("itemCodeType": 5), loan repayment is executed without a tax percentage.  "paymentNumber"  shows the serial number of the receipt of credit payment. "residue" is residue from the total amount of credit. "incomingSum" is actually deposited money.   
      "incomingSum" \= “sum” \+ “changeSum”.  
      “vatSum” \= “sum” \= “cashSum” \+ “cashlessSum” \+ “bonusSum”  
      If payment type is cashless, then “incomingSum” \= 0

      {

          "requestData": {

              "access\_token": "v9eu7ofO+/schwZsE6OOrQ==",

              "tokenData": {

                  "parameters": {

                      "doc\_type": "creditpay",

                      "data": {

                          "cashier": "Masha",

                          "currency": "AZN",

                          "parentDocument": "HXn6U3hRJUz9iTuejMiWhmRMrSLcWeYpi2Cafk3gBqkM",

                          "creditContract": "kreditcontract123456",

                          "paymentNumber": 1,

                          "items": \[

                              {

                                  "itemName": "Roasted Peanuts 100g pack",

                                  "itemCodeType": 5,

                                  "itemCode": "1564854651",

                                  "itemQuantityType": 0,

                                  "itemQuantity": 1,

                                  "itemPrice": 100,

                                  "itemSum": 100,

                                  "itemVatPercent": 18

                              }

                          \],

                          "residue": 50,

                          "sum": 50,

                          "cashSum": 50,

                          "cashlessSum": 0,

                          "prepaymentSum": 0,

                          "creditSum": 0,

                          "bonusSum": 0,

                "incomingSum": 50.0,

                          "vatAmounts": \[

                              {

                                  "vatSum": 50,

                                  "vatPercent": 18

                              }

                          \]

                      }

                  },

                  "operationId": "createDocument",

                  "version": 1

              },

              "checkData": {

                  "check\_type": 31

              }

          },

          "receiptDetails": \[

              {

                  "t": 0,

                  "k": "",

                  "v": "Please keep this receipt"

              },

              {

                  "t": 1,

                  "k": "Number",

                  "v": "new number"

              },

              {

                  "t": 2,

                  "k": "Number",

                  "v": "5258645"

              }

          \]

      }

    


    


   4. ## **Prepayment** {#prepayment}

      To generate a receipt for the purchase of a gift certificate, the payment type is indicated based on the buyer's method of payment. When using a gift certificate, the amount spent from the certificate is specified as an prepayment, and no tax is applied to it.

      {

      "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "tokenData":{

      "parameters":{ "doc\_type":"prepay",

       "data":{ "cashier":"Givi",

      "currency":"AZN", "items":\[

      {

      "itemName":"Gift certificate", "itemCodeType":1,

      "itemCode":"13245", "itemQuantity":1.0,

      "itemPrice":20.0, "itemSum":20.0,

      "itemVatPercent": 18

      }

      \],

      "sum":20.0,

      "cashSum":0.0, "cashlessSum":20.0, "prepaymentSum":0.0, "creditSum":0.0,

      "bonusSum":0.0, 

      "incomingSum": 0.0,

      "vatAmounts":\[

      {

      "vatSum":20.0,

      "vatPercent": 18

      }

      \]

      }

      },

      "operationId":"createDocument", "version":1

      },

      "checkData":{ "check\_type": 34

      }

      },

      "receiptDetails":\[

      {

      "t":0, "k":"",

      "v":"Please keep this receipt"

      },

      {

      "t":1,

      "k":"Number",

      "v":"new number"

      },

      {

      "t":2,

      "k":"Number",

      "v":"5258645"

      }

      \]

      }

    


   5. ## **Money back** {#money-back-1}

      1. ## **Moneyback of sale**  {#moneyback-of-sale}

      The money back should be issued only on the document previously generated and only on the previously sold products (you must specify the number of the sales receipt for which the return is carried out and information about the returned product, similar to its sale).

      {

      "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "tokenData":{

      "operationId":"createDocument", "parameters":{

      "data":{

      "bonusSum":0.0,

      "cashSum":0.0,

      "cashier":"fad", "cashlessSum":25.0, "creditSum":0.0,

      "currency":"AZN", "firstOperationAtUtc":"", "items":\[

         {

         "discount":0.0, "itemCode":"225555", "itemCodeType":0, "itemName":"test", "itemPrice":25.0, "itemQuantity":1.0, "itemQuantityType":0, "itemSum":25.0,

         "itemVatPercent":18.0

         }

      \],

      "lastOperationAtUtc":"", "parentDocument":"63YNLNiaWkFS9Q7XXwEY4fD25LiMEU2eE6xtoAPXXDju", "prepaymentSum":0.0,

      "refund\_document\_number":"1", "refund\_short\_document\_id":"63YNLNiaWkFS", "sum":25.0,

      "vatAmounts":\[

         {

         "vatPercent":18.0, "vatSum":25.0

         }

      \]

      },

      "doc\_type":"money\_back"

      },

      "version":1

      },

      "checkData":{ "check\_type":100

      }

      }

      }

      2. **MoneyBack of credit pay**

          The return receipt of the goods sold in both currently open and already closed fiscal shifts. Request should contain the “long\_id” of credit pay receipt in "parentDocument" parameter. Request should contain the "short\_id" of credit pay document in “refund\_short\_document\_id" parameter. "check\_type": should be  100 and "moneyBackType":7. “Items” contain data from original parent document, but payment fields should be equal to refunded money.  
         {  
             "requestData": {  
                 "access\_token": "+JMgGPshzQluDV5KdvtvgA==",  
                 "tokenData": {  
                     "operationId": "createDocument",  
                     "parameters": {  
                         "data": {  
                             "bonusSum": 0,  
                             "cashSum": 200,  
                             "cashier": "Superman",  
                             "cashlessSum": 0,  
                             "creditSum": 0,  
                             "currency": "AZN",  
                             "firstOperationAtUtc": "",  
                             "moneyBackType": 7,  
                             "items": \[  
                                {  
                                     "itemName": "Televizor",  
                                     "itemCodeType": 1,  
                                     "itemCode": "1564854651",  
                                     "itemQuantityType": 0,  
                                     "itemQuantity": 1,  
                                     "itemPrice": 2000,  
                                     "itemSum": 2000,  
                                     "itemVatPercent": 18  
                                 }  
                             \],  
                             "lastOperationAtUtc": "",  
                             "parentDocument": "DPGA3tfDc3DYn8ozZY4zovM14K8S6vXmjxRyiwpJvaNr",  
                             "prepaymentSum": 0,  
                             "refund\_document\_number": "1",  
                             "refund\_short\_document\_id": "DPGA3tfDc3DY",  
                             "sum": 200,  
                             "vatAmounts": \[  
                                 {  
                                     "vatPercent": 18,  
                                     "vatSum": 200  
                                 }  
                             \]  
                         },  
                         "doc\_type": "money\_back"  
                     },  
                     "version": 1  
                 },  
                 "checkData": {  
                     "check\_type": 100  
                 }  
             }  
         }  
           
      3. **MoneyBack of prepay residue** 

          MoneyBack of prepay residue receipt. Request should contain the “long\_id” of prepay receipt in "parents" parameter, "moneyBackType" should be equal to 6. Items fields should be same with prepay receipt, but “sum” and “vatSum” equal to refunded amount.  
           
         {  
             "requestData": {  
                 "access\_token": "59DStq9Iis14WAdbXUAQFA==",  
         "tokenData": {  
                     "operationId": "createDocument",  
                     "parameters": {  
                         "data": {  
                             "sum": 200.0,  
                             "cashSum": 100.0,  
                             "cashlessSum": 100.0,  
                             "bonusSum": 0.0,  
                             "cashier": "fad",  
                             "creditSum": 0.0,  
                             "currency": "AZN",  
                             "moneyBackType": 6,  
                             "firstOperationAtUtc": "",  
                             "items": \[  
                                 {  
                                     "itemName": "Podarocniy sertifikat",  
                                     "itemCodeType": 1,  
                                     "itemCode": "1564854651",  
                                     "itemQuantityType": 0,  
                                     "itemQuantity": 1.0,  
                                     "itemPrice": 300.0,  
                                     "itemSum": 300.0,  
                                     "itemVatPercent": 18.0,  
                                     "discount": 0.0  
                                 }  
                             \],  
                             "lastOperationAtUtc": "",  
                             "parentDocument": "9KxKAqMbN7yZnfMsPxKjoboUvuzERbFnZqkTwrmg2B17",  
                             "prepaymentSum": 0.0,  
                             "refund\_document\_number": "1",  
                             "refund\_short\_document\_id": "9KxKAqMbN7yZ",  
                             "vatAmounts": \[  
                                 {  
                                     "vatSum": 200.0,  
                                     "vatPercent": 18.0  
                                 }  
                             \]  
                         },  
                         "doc\_type": "money\_back"  
                     },  
                     "version": 1  
                 },  
                 "checkData": {  
                     "check\_type": 100  
                 }  
             }  
         }  
           
         

		**7.5.4	MoneyBack of Income Tax Products**  
			  
An income tax has been introduced for some categories of products, which requires a separation of the marginal part and cost, where the marginal part is taxed in accordance with the percentage of taxation, part of the cost is not taxed. Due to this reason, in the refund request as well, the amounts subject to Value Added Tax (VAT) and the amounts without VAT should be indicated separately as follows:

         {

	"requestData": {  
    		"access\_token": " SrZwcTcWKtLOk++rkgMwBg==",  
    		"tokenData": {  
            "operationId": "createDocument",  
            "parameters": {  
            	"data": {  
                    "bonusSum": 0.0,  
              	  "cashSum": 21.0,  
                    "cashier": "Mask",  
                    "cashlessSum": 30.0,  
                    "creditSum": 0.0,  
                    "currency": "AZN",  
                    "firstOperationAtUtc": "",  
                    "items": \[  
                        {  
                            "itemName": "Pomidor",  
                            "itemCodeType": 1,  
                            "itemCode": "1564800002",  
                            "itemQuantity": 3,  
                            "itemPrice": 17.0,  
                        "itemSum": 51.0,  
                            "itemVatPercent": 18.0,  
                            "itemMarginPrice": 9.0,  
                                 "itemMarginSum": 27.0,  
                            "discount": 0.0  
                    	}  
                	\],  
                    "lastOperationAtUtc": "",  
                    "parentDocument": "ENndzedY7XGWC2ZBrmJ9cbAZinSwdxh95hUyMm7Lsi33",  
                    "prepaymentSum": 0.0,  
                    "refund\_document\_number": "402",  
                    "refund\_short\_document\_id": "ENndzedY7XGW",  
                    "sum": 51.00,  
                    "vatAmounts": \[  
   	                 {  
                          			  "vatSum":27.0,  
                           			 "vatPercent": 18.0  
                       	 },  
                    	{  
                        	"vatSum": 24.00  
                    	}  
                	\]  
            },  
                "doc\_type": "money\_back"  
        	},  
        	"version": 1  
    	},  
    	"checkData": {  
            "check\_type": 100  
    	}

	}

}

6. ## **Rollback** {#rollback}

   1. **Sale Rollback**  
      Rollback should be executed only on a document previously generated as part of the current shift (you must specify the long\_id(long fiscal ID) number of the sales receipt, which will be canceled).

      {

      "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "checkData":{

      "check\_type":10

      },

      "fiscalId":"9mcZobUYvqnnsmxxF1JpTg9uNkCgT6na6Q833SQiBLBh"

      }

      }

      2. **CreditPay Rollback**

         Credit rollback receipt. Receipt of cancellation of credit pays check in the framework of the current open fiscal shift. Request should contain the “long\_id” of credit pay receipt in "fiscalId" parameter. "check\_type" should be 32  
         

          {  
             "requestData": {  
                 "access\_token": "{{access\_token}}",  
                 "tokenData": {  
                     "parameters": {             
                         "doc\_type": "rollback",  
                         "data": {  
                             "cashier": "Givi",  
                             "currency": "AZN",  
                             "parentDocument": "7npC1DqpFMpSFPMGfwzG3Z5uLKYxPyoGC2CEm2z5bvmF",  
                             "sum": 100.00,  
                             "cashSum": 50.00,  
                             "cashlessSum": 50.00,  
                             "prepaymentSum": 0,  
                             "creditSum": 0,  
                             "bonusSum": 0,  
                             "items": \[  
                                 {  
                                     "itemName": "Samsung TV 55 inch",  
                                     "itemCodeType": 1,  
                                     "itemCode": "1894981988",  
                                     "itemQuantityType": 0,  
                                     "itemQuantity": 1,  
                                     "itemPrice": 1000.00,  
                                     "itemSum": 1000.00,  
                                     "itemVatPercent": 18,  
                                     "itemMarginPrice": null,  
                                     "itemMarginSum": null  
                                 }  
                             \],  
                             "vatAmounts": \[  
                                 {  
                                     "vatSum": 100,  
                                     "vatPercent": 18  
                                 }  
                             \]  
                         }  
                     },  
                     "operationId": "createDocument",  
                     "version": 1  
                 },  
                 "checkData": {  
                     "check\_type": 32  
                 }  
             }  
         }  
           
      3. **CreditSale& Sale with prepay Rollback**  
           
         CreditSale and Sale with prepay rollback receipt.   
         Receipt of cancellation of creditSale and sale with prepay check in the framework of the current open fiscal shift. Request should contain the “long\_id” of creditSale or sale with prepay receipt in   
         "parentDocument " parameter. "check\_type" should be 32  
         {  
             "requestData": {  
                 "access\_token": "{{access\_token}}",  
                 "tokenData": {  
                     "parameters": {             
                         "doc\_type": "rollback",  
                         "data": {  
                             "cashier": "Givi",  
                             "currency": "AZN",  
                             "parentDocument": "CxaYWzkcQQrmVjc4qJ4zJi5Xgsna9R1Pk7AyEeZo44AK",  
                            "sum": 0,  
                             "cashSum": 0,  
                             "cashlessSum": 0,  
                             "prepaymentSum": 1000.00, // if Sale with prepay else 0  
                             "creditSum": 1000.00, //if creditSale else 0  
                             "bonusSum": 0,  
                             "items": \[  
                                {  
                                     "itemName": "Samsung TV 55 inch",  
                                     "itemCodeType": 1,  
                                     "itemCode": "1894981988",  
                                     "itemQuantityType": 0,  
                                     "itemQuantity": 1,  
                                     "itemPrice": 1000.00,  
                                     "itemSum": 1000.00,  
                                     "itemVatPercent": 18  
                                 }  
                             \],  
                             "vatAmounts": \[  
                                 {  
                                     "vatSum": 0,  
                                     "vatPercent": 18  
                                 }  
                             \]  
                         }  
                     },  
                     "operationId": "createDocument",  
                     "version": 1  
                 },  
                 "checkData": {  
                     "check\_type": 32  
                 }  
             }  
         }

   7. ## **Correction** {#correction-1}

      The correction operation is carried out in the case of sales without a cash register due to an accident and includes aggregated information about all operations without a cash register for the emergency period.

      {

      "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "tokenData":{

      "parameters":{ "doc\_type":"correction", "data":{ "cashier":"Masha",

      "firstOperationAtUtc":"2020-01-07T08:00:00Z", "lastOperationAtUtc":"2020-01-08T14:00:00Z", "currency":"AZN",

      "sum":100.0,

      "cashSum":50.0, "cashlessSum":50.0, "prepaymentSum":0.0, "creditSum":0.0,

      "bonusSum":0.0, "vatAmounts":\[

      {

      "vatSum":100.0, "vatPercent":18.0

      }

      \]

      }

      },

      "operationId":"createDocument", "version":1

      },

      "checkData":{ "check\_type":19

      }

      }

      }

      

   8. **Cashbox operations**  
      This operations supported only in TPS575. The cashbox is connected to the cash register through the RJ-11 cable. “check\_type” field determine type of operation.

      1. **Open the cashbox.**

       “check\_type”:28 – open the cashbox

         {

           "requestData": 

               {

                 "checkData": 

                    {

                      "check\_type":28

                    }

               }

         }

         

      2. **Close the cashbox**

        “check\_type”:29 – open the cashbox

         {

           "requestData": 

               {

                 "checkData": 

                    {

                      "check\_type":29

                    }

               }

         }

      

         

   9. ## **Tips** {#tips}

      Tipping is made together with other products as a separate service (product). The gratuities indicated in the check are considered to be payment for the service and tax is deducted from them in accordance with the interest rate applied at the facility.

      {

      "requestData":{ "access\_token":"7dOF7HlXb/uG2J/FD+GtjA==", "tokenData":{

      "parameters":{ "doc\_type":"sale", "data":{ "cashier":"Givi",

      "currency":"AZN", "items":\[

      {

      "itemName":"Шашлык", "itemCodeType":1, "itemCode":"15648594", "itemQuantity":0.415, "itemPrice":100.0, "itemSum":41.5, "itemVatPercent":8.0

      },

      {

      "itemName":"Чаевые-10%", "itemCodeType":3, "itemCode":"1", "itemQuantity":1.0, "itemPrice":4.15, "itemSum":4.15, "itemVatPercent":8.0

      }

      \],

      "sum":45.65,

      "cashSum":45.65, "cashlessSum":0.0, "prepaymentSum":0.0, "creditSum":0.0,

      "bonusSum":0.0, 

      "incomingSum": 50.0,

      "vatAmounts":\[

      {

      "vatSum":45.65, "vatPercent":8.0

      }

      \]

      }

      },

      "operationId":"createDocument", "version":1

      },

      "checkData":{ "check\_type":1

      }

      }

      }

About Operations 

| Operation Name  |  |
| :---- | :---- |
| Withdraw | The operation of withdrawing money from the cash drawer |
| Correction | Correction operation in case of not entering information into the token (in case when cashbox unavailable for sale an was postpound on later) |

8. # **Documents validations** {#documents-validations}

   1. ## **Header** {#header}

| Rule | Note |
| :---- | :---- |
| Currency | AZN |
| No negative amounts |  |

| Cashier name "cashier" maximum length | 64 |
| :---- | :---- |

2. **Sale**

| Rule | Note |
| :---- | :---- |
| Additional printing fields maximum lenght | 36 |
| Quantity of commodity items | 1 \<= N \<= 201 |
| Product Code Type Valid Values Only | \[0,1,2,3,4,5\] |
| Product Code Maximum Length | 32 |
| All percent of taxes listed in the product’s "items" should be listed in the tax section "vatAmounts" |  |
| Rounding within the heading no more than 0.01 for each unit of the products | | items.sum \- items.itemPrice \* itemQuantity | \<= 0.01 \* itemQuantity \+ 0.01 |
| Total rounding for sum of units “itemSum” should not exceed 0.01 |  |
| The check amount is precisely detailed by various payment methods | Sum \= cashSum+cashlessSum+bonusSum |
| The check amount is precisely detailed in the tax section "vatAmounts" | | Sum \- sum(vatAmounts.vatSum) | \<= 0.01 |
| Tax amounts listed in "vatAmounts" correspond to the amounts of taxes indicated in "items" |  |
| The amount of margin does not exceed the value of the products | itemMarginSum \<= itemSum |
| Product margin is not more than the cost of products | itemMarginPrice \<= itemPrice |
| Correspondence of the amount of margin and margin difference | | itemMarginSum-itemMarginPrice \* itemQuantity | \<= 0.01 \* itemQuantity \+ 0.01 |
| PrepaymentSum and CreditSum doesn’t affect to sum and varSum. |  |
|  |  |

   3. ## **Money\_back** {#money_back}

| Rule | Note |
| :---- | :---- |
| Quantity of commodity items | 1 \<= N \<= 201 |
| The maximum length of the fiscal identifier of the document to be returned | 64 |
| Product code type valid values only | \[0,1,2,3,4,5\] |
| Product Code Maximum Length | 32 |
| All percent of taxes listed in the product’s "items" should be listed in the tax section "vatAmounts" |  |

| Rounding within the heading no more than 0.01 for each unit of the products | | items.sum \- items.itemPrice \* itemQuantity | \<= 0.01 \* itemQuantity \+ 0.01 |
| :---- | :---- |
| Rounding is permissible for each heading not more than 0.01 | | all(items.sum) \- Sum | \<= count\_of\_items/100 |
| Amount is precisely detailed by various payment methods | Sum \= cashSum+cashlessSum+prepaymentSu m+creditSum+bonusSum |
| The check amount is precisely detailed in the tax section "vatAmounts" | | Sum \- sum(vatAmounts.vatSum) | \<= 0.01 |
| Tax amounts listed in "vatAmounts" correspond to the amounts of taxes indicated in "items" |  |
| The amount of margin does not exceed the value of the products | itemMarginSum \<= itemSum |
| Product margin is not more than the cost of products | itemMarginPrice \<= itemPrice |
| Correspondence of the amount of margin and margin difference | | itemMarginSum-itemMarginPrice \* itemQuantity | \<= 0.01 \* itemQuantity \+ 0.01 |
| On money back of creditpay, request should contain “moneyBackType:7” parameter, “items” array should have parameters from original credit sale document, but “data” array should take same parameter from creditpay document. | "moneyBackType": 7.  |
| On money back of sale with prepayment, goods can be returned in cash, cashless and bonus.  | "prepaymentSum": 0.0  |

4. **Rollback**

| Rule | Note |
| :---- | :---- |
| The maximum length of the fiscal identifier of the document to be returned | 64 |
| Amount is precisely detailed by various payment methods | Sum \= cashSum+cashlessSum+prepaymentSu m+creditSum+bonusSum |
| The check amount is precisely detailed in the tax section "vatAmounts" | | Sum \- sum(vatAmounts.vatSum) | \<= 0.01 |

   5. ## **Correction** {#correction-2}

| Rule | Note |
| :---- | :---- |
| Amount is precisely detailed by various payment methods | Sum \= cashSum+cashlessSum+bonusSum |
| Amount is precisely detailed by various payment methods | Sum \= cashSum+cashlessSum+bonusSum |
| The check amount is precisely detailed in the tax section "vatAmounts" | | Sum \- sum(vatAmounts.vatSum) | \<= 0.01 |

   9. **Token information & error codes**

| 0 operation success |
| :---- |
| 101 generic initialization error |
| 102 init hal drivers failed |
| 103 init hal rcc failed |
| 104 init hal rcc clock failed |
| 105 init hal fram (fast memory) driver failed |
| 106 init hal winbond (slow memory) driver failed |
| 107 init random hal driver failed |
| 108 init fast memory wrapper failed |
| 109 init slow memory wrapper failed |
| 110 memory overflow |
| 111 generate new number with random module failed |
| 112 initialization for bootloader: set firmware flag failed |
| 113 erase sector with hal driver failed |
| 114 write to flash memory failed (mem for firmware) |
| 115 hal: init iwdg falied |
| 201 io operation overflow memory |
| 202 io object is not free |
| 203 io object is not found |
| 204 io operation isn't available in this state |
| 205 io operation internal error |
| 206 io invalid page number |
| 207 io operation page overflow |
| 208 storage page is not empty |
| 209 storage page is coppupted |
| 210 storage page: seek overflow |
| 211 storage page: can not flush empty |
| 212 storage page: invalid page type |
| 213 storage file: storage overflow |
| 214 storage file: read overflow |
| 215 storage file: remove not first |
| 216 storage file: file not found |
| 217 storage has no free space |
| 218 storage: document for remove isn't exist |
| 219 storage: last document guid isn't matched |
| 220 flash: data already exists |
| 221 flash: data isn't exist |
| 222 flash: rw op overflow |

| 223 lifo core: invalid page ordering |
| :---- |
| 224 lifo core: next file overflow |
| 225 lifo core: invalid next data page |
| 226 lifo core: invalid file for commit |
| 227 io file: flush with empty data |
| 301 ecc: sign data failed |
| 302 ecc: verify sign failed |
| 303 ecc: verify sign failed |
| 304 handler: invalid json schema |
| 305 handler: unknown command |
| 306 handler: unsupported command in this tok state |
| 307 handler: invalid usb packet |
| 308 handler: too big usb packet |
| 309 handler: invalid crc in usb packet |
| 310 handler: unknown ticket type |
| 311 handler: base64 encoding error |
| 312 handler: ticket rejected by server |
| 313 handler: check max string size failed |
| 401 invalid login session |
| 403 invalid user role |
| 404 incorrect pin code |
| 405 pin locked too many invalid pins |
| 406 incorrect puk code |
| 407 puk locked too many invalid puks |
| 501 invalid document type |
| 502 c memory allocation error |
| 503 document: invalid shift status |
| 504 document: invalid shift duration |
| 505 document: invalid previous document number  |
| 601 cashbox number \!= value from company certificate |
| 602 cashregister number \!= value from company certificate |
| 603 document time must be longer than the previous one |
| 604 document time not in permitted interval |
| 605 document counter is overflow |
| 606 invalid currency name |
| 607 invalid total sum |
| 608 too long cashier string |
| 609 too long item code string |

| 610 items array is empty |
| :---- |
| 611 invalid items sum |
| 612 invalid item code type |
| 613 invalid vat amounts total |
| 614 invalid total sum in one item |
| 615 too long parent doc length |
| 616 invalid percentages |
| 617 invalid item margin price |
| 618 invalid item margin sum |
| 619 invalid item margin price quantity |
| 620 too many items |
| 621 expected no documents on the storage |
| 630 contract field has invalid length |
| 701 generate csr failed |
| 702 der parsing error |
| 703 invalid primary key type in the certificate |
| 704 invalid primary key curve type in the certificate |
| 705 invalid signature type in the certificate |
| 706 certificate is already expired |
| 707 failed to init mbedtls library |
| 708 convert public key failed |
| 709 convert primary key failed |
| 710 keypairs are not equial |
| 711 failed to verify certificate chain |
| 712 failed to parse custom oid |
| 713 uuid oid not found in the certificate |
| 714 token uuid is not equal to uuid from certificate |
| 715 invalid common name in the certificate |
| 716 common name is not found |
| 717 invalid common name in the certificate |
| 718 updated certificate not after old certificate |
| 719 updated certificate is not in permitted time interval |
| 720 generate fake company ca certificate failed (for test only) |
| 721 generate fake server signature failed (for test only) |
| 801 transacted object has invalid id |
| 802 transaction is not started |
| 900 offset of all cbor errors |
| 901 cbor: unknown error |

| 902 cbor: unknown field length |
| :---- |
| 903 cbor: advance past eof |
| 904 cbor: io error |
| 905 cbor: it is a garbage at the end of container |
| 906 cbor: unexpected eof |
| 907 cbor: unexpected break |
| 908 cbor: unknown unknown type |
| 909 cbor: illegal value type |
| 910 cbor: illegal number |
| 911 cbor: illegal simple type |
| 912 cbor: unknown simple type |
| 913 cbor: unknown tag |
| 914 cbor: inappropriate tag for type |
| 915 cbor: duplicate object keys |
| 916 cbor: invalid utf8 text string |
| 917 cbor: excluded type |
| 918 cbor: excluded value |
| 919 cbor: improper value |
| 920 cbor: overlong encoding |
| 921 cbor: map key is not string |
| 922 cbor: map is not sorted |
| 923 cbor: map keys are not unique |
| 924 cbor: too many items |
| 925 cbor: too few items |
| 926 cbor: data is too large |
| 927 cbor: esting is too deep |
| 928 cbor: unsupported type |
| 929 cbor: internal error |
| 930 cbor: out of memory |
| 65500 unknown error |
| 0 operation success |
| \-1 unknown pks error |
| \-2 operation timeout error |
| \-3 token not found or in invalid state |
| \-4 memory allocation error (out of mem) |
| \-5 parse arguments error |
| \-6 json parsing failed |

| \-7 invalid arguments in func call |
| :---- |
| \-8 protocol version is not supported |
| \-9 request type is not supported |
| \-10 operation execution failed |
| \-11 invalid cached auth token |
| \-12 usb packet r/w error |
| \-13 usb: unsupported device mod |

10. ## **API error codes** {#api-error-codes}

| Code | Description |
| :---- | :---- |
| 99 | Restriction Error |
| 401 | Parse error: Invalid API key |
| 1200 | Please print previous document |
| 1210 | /\#Error: external printer error... \#Error: status shift.. REPORTSERROR |
| 1250 | Error: parse request.... Shift invalid status/\#Error: Sellers and item’s VAT percentage does not match… |
| 1300 | Parse error Error parse Operation Info.. |
| 1301 | JSON Parse Exception |
| 1302 | JSON Syntax Exception |
| 1312 | Error: already refunded/rollbacked. REFUNDROLLBACKERROR Error: Invalid document VAT amounts total sum... |
| 1412 | Another document in QUEUE. \#Error: external printer error. PRINTERERROR |
| 1511 | write operation, insert error. DB: error./write operation, insert error DBCode |
| 1512 | Error: parse string CASHINOUTERROR |

[image1]: <data:image/png;base64,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>