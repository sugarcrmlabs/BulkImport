<?php

// Enrico Simonetti
// 2017-03-16

require_once('custom/include/bulkimport/BulkImport.php');

class UsersBulkImport extends BulkImport
{
    public function usersAfterSave($b, $data, $args)
    {
        // do nothing, this is just an example
    }
}
