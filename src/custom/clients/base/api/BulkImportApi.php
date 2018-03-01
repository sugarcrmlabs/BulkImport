<?php

// Enrico Simonetti
// 2017-03-09
//
// POST based Bulk API for Sugar, that completes SQL based lookups based on external system's unique keys and inserts or updates multiple beans per HTTP request at once

require_once('custom/include/bulkimport/BulkImport.php');

if(!defined('sugarEntry') || !sugarEntry) {
    die('Not A Valid Entry Point');
}

class BulkImportApi extends SugarApi
{
    private $bulkImportObject;

    public function registerApiRest()
    {
        return array(
            array(
                'reqType' => 'POST',
                'path' => array('BulkImport', 'records', '?'),
                'pathVars' => array('', '', 'module'),
                'method' => 'bulkImport',
                'minVersion' => 10,
                'maxVersion' => 11,
                'shortHelp' => 'Admin Only - POST BulkImport/records/:module post a list of {"records":[]}',
            ),
            array(
                'reqType' => 'POST',
                'path' => array('BulkImport', 'relationships', '?', '?'),
                'pathVars' => array('', '', 'module', 'linkfield'),
                'method' => 'bulkImportRelationship',
                'minVersion' => 10,
                'maxVersion' => 11,
                'shortHelp' => 'Admin Only - POST BulkImport/relationships/:module/:linkfield post a list of {"records":[]} with left external key and right external key',
            ),
        );
    }

    protected function bulk() {
        if (empty($this->bulkImportObject)) {
            $this->bulkImportObject = new BulkImport();
        }
        return $this->bulkImportObject;
    }

    public function bulkImport($api, $args)
    {
        $total_t_start = microtime(true);
        global $current_user;

        $this->bulk()->checkIfCurrentUserIsAdmin();

        // disable activity stream
        Activity::disable();

        $GLOBALS['log']->info('Bulk Import - resource: ' . $args['__sugar_url']);

        $this->bulk()->checkImportArgsForModules($args);

        // one bean for all the lookup loop
        $samplebean = BeanFactory::getBean($args['module']);

        if (!isset($samplebean)) {
            $this->bulk()->parameterError('Lookup Bean ' . $args['module'] . ' load failed');
        }

        if (!empty($args['records'] && is_array($args['records']))) {
            if (count($args['records']) > $this->bulk()->getRecordLimit()) {
                $this->bulk()->parameterError('The request contains too many records. Please provide less than ' . $this->bulk()->getRecordLimit() . ' records per call');
            }

            // do we need to impersonate?
            if (!empty($args['save_as_user_id'])) {
                $this->bulk()->impersonateUserById($args['save_as_user_id']);
            }

            foreach ($args['records'] as $record) {
                $this->bulk()->handleRecordSave($record, $samplebean, $args);
            }

            // restore user (only happens if it was impersonated)
            $this->bulk()->restoreApiUser();
        } else {
            $this->bulk()->parameterError('An array of records is required as input');
        }

        $this->bulk()->logExecutionTime((microtime(true) - $total_t_start));

        $GLOBALS['log']->info('Bulk Import - API records processed in : ' . (microtime(true) - $total_t_start) . ' seconds. '. print_r($this->bulk()->getResponseArray(), true));

        return $this->bulk()->getResponseArray();
    }

    public function bulkImportRelationship($api, $args)
    {
        $total_t_start = microtime(true);
        global $current_user;

        $this->bulk()->checkIfCurrentUserIsAdmin();

        // disable activity stream
        Activity::disable();

        $GLOBALS['log']->info('Bulk Import - resource: ' . $args['__sugar_url']);

        if (empty($args['linkfield']) || empty($args['module']) || empty($args['records'])) {
            $this->bulk()->parameterError(
                'The following parameters are empty: ' .
                (empty($args['module']) ? 'Module' : '') .
                (empty($args['linkfield']) ? 'Link Field' : '') .
                (empty($args['records']) ? ', Records' : '')
            );
        }

        if (!in_array($args['module'], $this->bulk()->getAllowedRelationshipModules())) {
            $this->bulk()->parameterError('Relationship\'s module ' . $args['module'] . ' not allowed');
        }

        if (!in_array($args['linkfield'], $this->bulk()->getAllowedRelationshipLinkfields($args['module']))) {
            $this->bulk()->parameterError('Relationship\'s linkfield ' . $args['linkfield'] . ' not allowed');
        }

        // one bean for all the lookup loop
        $sampleleftbean = BeanFactory::getBean($args['module']);
        if (!isset($sampleleftbean)) {
            $this->bulk()->parameterError('Relationship left lookup bean: ' . $args['module'] . ' load failed');
        }

        // find the right side bean and load it
        $sampleleftbean->load_relationship($args['linkfield']);
        if (!empty($sampleleftbean->{$args['linkfield']})) {
            if ($sampleleftbean->{$args['linkfield']}->getRelationshipObject()->getRHSModule() == $args['module']) {
                $right_module = $sampleleftbean->{$args['linkfield']}->getRelationshipObject()->getLHSModule();
            } else {
                $right_module = $sampleleftbean->{$args['linkfield']}->getRelationshipObject()->getRHSModule();
            }
            $samplerightbean = BeanFactory::getBean($right_module);
        }

        if (!isset($samplerightbean)) {
            $this->bulk()->parameterError('Relationship right lookup bean failed for module '.$args['module'].' with link field '.$args['linkfield']);
        }

        if (!empty($args['records'] && is_array($args['records']))) {
            if (count($args['records']) > $this->bulk()->getRecordLimit()) {
                $this->bulk()->parameterError('The request contains too many records. Please provide less than ' . $this->bulk()->getRecordLimit() . ' records per call');
            }

            // do we need to impersonate?
            if (!empty($args['save_as_user_id'])) {
                $this->bulk()->impersonateUserById($args['save_as_user_id']);
            }

            foreach ($args['records'] as $record) {
                $this->bulk()->handleRelationshipSave($record, $sampleleftbean, $samplerightbean, $args);
            }

            // restore user (only happens if it was impersonated)
            $this->bulk()->restoreApiUser();
        } else {
            $this->bulk()->parameterError('An array of records is required as input');
        }

        $this->bulk()->logExecutionTime((microtime(true) - $total_t_start));

        $GLOBALS['log']->info('Bulk Import - API records processed in : ' . (microtime(true) - $total_t_start) . ' seconds. '. print_r($this->bulk()->getResponseArray(), true));

        return $this->bulk()->getResponseArray();
    }
}
