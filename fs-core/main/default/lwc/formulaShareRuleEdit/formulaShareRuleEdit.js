import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from 'lightning/empApi';
import submitForEdit from '@salesforce/apex/FormulaShareMetadataControllerRules.submitForEdit';
import getNamespacePrefix from '@salesforce/apex/FormulaShareUtilities.getNamespacePrefix';


export default class FormulaShareRuleEdit extends LightningElement {
    @api ruleId;
    ruleDetails;
    @track processingEdit = false;

    updateRule(event) {
        this.ruleDetails = event.detail;
    }

    // Subcribes to list platform event, and refresh treegrid each time event is received
    connectedCallback() {
        const messageCallback = (response) => {
            this.processingEdit = false;

            // Success attribute contains package namespace
            if(response.data.payload.Successful__c || response.data.payload.sdfs__Successful__c) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'FormulaShare Rule updated',
                        variant: 'success'
                    })
                );

                // Close modal
                this.closeModal();
            }

            // Indicate update failure in toast
            else {
                var errorMessage;
                if(response.data.payload.sdfs__Error__c) {
                    errorMessage = response.data.payload.sdfs__Error__c
                }
                else {
                    errorMessage = response.data.payload.Error__c;
                }
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Update Failed',
                        message: errorMessage,
                        variant: 'error'
                    })
                );
            }
        };

        // Get namespace prefix
        getNamespacePrefix()
            .then((prefix) => {
                // Invoke subscribe method of empApi. Pass reference to messageCallback
                subscribe('/event/'+prefix+'FormulaShare_Rule_DML__e', -1, messageCallback).then(response => {
                    //console.log('Successfully subscribed to : ', JSON.stringify(response.channel));
                });
            })
            .catch(error => {
                this.showError(error, 'Error getting namespace prefix');
            });
    }

    closeModal() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    spinnerClasses;
    saveMethod() {

        // Check all components report positive validity
        var allValid = this.template.querySelector('c-formula-share-rule-detail').checkValidity();

        if(allValid) {
            //console.log('this.ruleDetails '+  JSON.stringify(this.ruleDetails));
            this.processingEdit = true;
            this.spinnerClasses = 'processingMessage';
            submitForEdit({ fsRuleString : JSON.stringify(this.ruleDetails) })
                .then(() => {

                    // After submitting, wait 5 seconds and add class to display 
                    setTimeout(() => {
                        this.spinnerClasses = 'processingMessage afterProcessingMessage';
                    }, 5000);
                })
                .catch(error => {
                    this.processingEdit = false;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error saving rule',
                            message: 'Message from Salesforce: ' + JSON.stringify(error),
                            variant: 'error'
                        })
                    );
                });
        }
    }

    addAfterMessage() {
        this.spinnerClasses = 'deployMessage afterMessage';
    }
}