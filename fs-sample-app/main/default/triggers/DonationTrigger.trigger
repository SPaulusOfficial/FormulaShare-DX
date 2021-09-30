trigger DonationTrigger on Donation__c (after insert, after update, after delete, after undelete) {
	sdfs.FormulaShareHelper helper = new sdfs.FormulaShareHelper();
    insert helper.getSharesToInsert();
    delete helper.getSharesToDelete();
}